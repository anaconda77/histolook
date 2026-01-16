import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  TextInput,
  RefreshControl,
  Image as RNImage,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect, usePathname, useSegments } from 'expo-router';
import { ChevronLeft, Tag, Bell, MoreVertical } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { archiveAPI, ArchiveDetail, ArchiveComment } from '../../services/archive.api';
import { alarmAPI } from '../../services/alarm.api';
import { NavigationBar } from '../../components/navigation-bar';
import { useArchiveCache } from '../../contexts/ArchiveCacheContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 이미지 URL에 캐싱 주기(1시간)를 고려한 타임스탬프 추가
// 1시간마다 새로운 URL로 인식되어 캐시가 갱신됨
const getCachedImageUrl = (url: string): string => {
  if (!url) return url;
  
  // 이미 쿼리 파라미터가 있는 경우
  const hasQuery = url.includes('?');
  
  // 1시간(3600000ms) 단위로 타임스탬프 생성
  const cacheTimestamp = Math.floor(Date.now() / (60 * 60 * 1000));
  
  return hasQuery 
    ? `${url}&_t=${cacheTimestamp}`
    : `${url}?_t=${cacheTimestamp}`;
};

export default function ArchiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCache, setCache } = useArchiveCache();
  
  const [archiveDetail, setArchiveDetail] = useState<ArchiveDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [isStoryTruncated, setIsStoryTruncated] = useState(false); // 스토리가 2줄을 초과하는지 여부
  const [storyMeasured, setStoryMeasured] = useState(false); // 스토리 줄 수 측정 완료 여부
  const [userNickname, setUserNickname] = useState<string>('나');
  const [comments, setComments] = useState<ArchiveComment[]>([]);
  const [commentFilter, setCommentFilter] = useState<'archive' | 'de-archive'>('archive'); // 코멘트 필터 상태
  const [userId, setUserId] = useState<string | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false); // 댓글 모달 표시 여부
  const [modalCommentFilter, setModalCommentFilter] = useState<'archive' | 'de-archive'>('archive'); // 모달 내 필터
  const [alarmCount, setAlarmCount] = useState(0); // 알림 개수
  
  // 판정 모달 상태
  const [showJudgementModal, setShowJudgementModal] = useState(false);
  const [judgementType, setJudgementType] = useState<'archive' | 'de-archive' | null>(null);
  const [judgementComment, setJudgementComment] = useState('');
  const [judgementPrice, setJudgementPrice] = useState('');
  const [isSubmittingJudgement, setIsSubmittingJudgement] = useState(false);
  
  // 비로그인 팝업 상태
  const [showLoginRequiredModal, setShowLoginRequiredModal] = useState(false);
  
  // 댓글 모달 드래그 애니메이션
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const modalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // 판정 모달 애니메이션
  const judgementModalTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const judgementModalBackgroundOpacity = useRef(new Animated.Value(0)).current;
  
  // 코멘트 모달 스와이프 ScrollView ref
  const commentSwipeScrollViewRef = useRef<ScrollView>(null);
  
  // 스크롤 애니메이션
  const scrollY = useRef(new Animated.Value(0)).current;
  const [scrollOffset, setScrollOffset] = useState(0);
  
  // 가격 애니메이션용 Animated Value
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayPrice, setDisplayPrice] = useState(0);

  // 이미지 흐림 효과
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });
  
  // 부드러운 숫자 롤링 애니메이션 (통장 잔고처럼)
  useEffect(() => {
    if (archiveDetail?.averagePrice) {
      // 초기화
      animatedValue.setValue(0);
      
      // 애니메이션 실행 (더 빠르게)
      Animated.timing(animatedValue, {
        toValue: archiveDetail.averagePrice,
        duration: 600, // 0.6초
        easing: Easing.out(Easing.cubic), // 부드러운 감속
        useNativeDriver: false,
      }).start();

      // 값 변경 리스너
      const listenerId = animatedValue.addListener(({ value }) => {
        setDisplayPrice(Math.floor(value));
      });

      return () => {
        animatedValue.removeListener(listenerId);
      };
    }
  }, [archiveDetail?.averagePrice]);

  // 스토리 텍스트 변경 시 truncation 상태 초기화
  useEffect(() => {
    if (archiveDetail?.story) {
      setIsStoryTruncated(false);
      setIsStoryExpanded(false);
      setStoryMeasured(false);
    }
  }, [archiveDetail?.story]);

  // 댓글 모달 헤더 드래그 PanResponder (스와이프 바 영역용)
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 세로 방향 이동이 가로보다 크면 PanResponder 활성화
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // 아래로만 드래그 가능
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // 150px 이상 아래로 드래그하면 모달 닫기
        if (gestureState.dy > 150) {
          Animated.parallel([
            Animated.timing(modalTranslateY, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(modalBackgroundOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start(() => {
            setShowCommentsModal(false);
            modalTranslateY.setValue(0);
            modalBackgroundOpacity.setValue(0);
          });
        } else {
          // 원위치로 되돌림
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // 네비게이션 스택 상태 로그 출력
  const pathname = usePathname();
  const segments = useSegments();
  
  useFocusEffect(
    useCallback(() => {
      const canGoBack = router.canGoBack();
      const currentPath = `/archive-detail/${id}`;
      
      // 네비게이션 히스토리 업데이트 (로그 없이)
      (async () => {
        const historyStr = await AsyncStorage.getItem('navigationHistory');
        let history: string[] = historyStr ? JSON.parse(historyStr) : [];
        
        // 현재 경로가 마지막과 다르면 추가
        if (history.length === 0 || history[history.length - 1] !== currentPath) {
          history.push(currentPath);
          // 최대 10개까지만 유지
          if (history.length > 10) {
            history = history.slice(-10);
          }
          await AsyncStorage.setItem('navigationHistory', JSON.stringify(history));
        }
        
      })();
      
      // 이전 경로 저장
      AsyncStorage.setItem('previousRoute', currentPath);
      
      // 알림 개수 조회
      (async () => {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (accessToken) {
            const alarmCountData = await alarmAPI.getAlarmCount(accessToken);
            setAlarmCount(alarmCountData.count);
          } else {
            setAlarmCount(0);
          }
        } catch (error) {
          // 알림 개수 조회 실패는 무시
          console.error('알림 개수 조회 실패:', error);
          setAlarmCount(0);
        }
      })();
    }, [pathname, segments, router, id])
  );

  useEffect(() => {
    loadArchiveDetail();
  }, [id]);

  // 댓글 모달 열릴 때 애니메이션 및 스크롤 위치 설정
  useEffect(() => {
    if (showCommentsModal) {
      modalTranslateY.setValue(1000);
      modalBackgroundOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(modalTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 10,
        }),
        Animated.timing(modalBackgroundOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        // 모달이 열린 후 스크롤 위치를 현재 필터에 맞게 설정
        setTimeout(() => {
          const scrollX = modalCommentFilter === 'archive' ? 0 : SCREEN_WIDTH;
          commentSwipeScrollViewRef.current?.scrollTo({ x: scrollX, animated: false });
        }, 100);
      });
    }
  }, [showCommentsModal]);

  const loadArchiveDetail = async (ignoreCache: boolean = false) => {
    try {
      
      // 캐시 확인 (ignoreCache가 true면 캐시 무시)
      const cachedDetail = ignoreCache ? null : getCache(id);
      
      const accessToken = await AsyncStorage.getItem('accessToken');
      
      if (cachedDetail && !ignoreCache) {
        setArchiveDetail(cachedDetail);
        
        // 사용자 정보 설정
        if (accessToken) {
          const memberIdFromStorage = await AsyncStorage.getItem('memberId');
          const nickname = await AsyncStorage.getItem('nickname');
          setUserId(memberIdFromStorage);
          setIsAuthor(memberIdFromStorage === cachedDetail.authorId);
          if (nickname) {
            setUserNickname(nickname);
          }
        }
        
        // 로딩 종료 - 캐시 사용 시 즉시 화면 표시
        setIsLoading(false);
        
        // 코멘트는 백그라운드에서 로드 (실시간 업데이트를 위해)
        try {
          const commentsList = await archiveAPI.getArchiveComments(id);
          setComments(commentsList);
        } catch (commentError) {
          setComments([]);
        }
      } else {
        // 캐시가 없으면 API 호출
        const [detail, commentsList] = await Promise.all([
          archiveAPI.getArchiveDetail(id, accessToken || undefined),
          archiveAPI.getArchiveComments(id),
        ]);
        
        // 캐시에 저장
        setCache(id, detail);
        
        setArchiveDetail(detail);
        setComments(commentsList);
        
        // 작성자 확인 및 사용자 정보 가져오기
        if (accessToken) {
          const memberIdFromStorage = await AsyncStorage.getItem('memberId');
          const nickname = await AsyncStorage.getItem('nickname');
          setUserId(memberIdFromStorage);
          setIsAuthor(memberIdFromStorage === detail.authorId);
          if (nickname) {
            setUserNickname(nickname);
          }
        }
        
        // 로딩 종료
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('❌ 아카이브 상세 조회 실패:', error);
      console.error('에러 응답:', error.response?.data);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 메시지:', error.message);
      setIsLoading(false);
      Alert.alert(
        '오류',
        '페이지 로드하는데 실패했습니다.',
        [
          {
            text: '확인',
            onPress: () => router.back()
          }
        ]
      );
    }
  };

  // Pull-to-refresh 핸들러
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadArchiveDetail(true); // 캐시 무시하고 새로고침
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const handleBackPress = () => {
    router.back();
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  // 판정 모달 열기
  const openJudgementModal = async (type: 'archive' | 'de-archive') => {
    // 비로그인 상태 체크
    const accessToken = await AsyncStorage.getItem('accessToken');
    if (!accessToken) {
      setShowLoginRequiredModal(true);
      return;
    }
    
    setJudgementType(type);
    setJudgementComment('');
    setJudgementPrice('');
    setShowJudgementModal(true);
    
    // 애니메이션 시작
    Animated.parallel([
      Animated.spring(judgementModalTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(judgementModalBackgroundOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // 판정 모달 닫기
  const closeJudgementModal = () => {
    Animated.parallel([
      Animated.timing(judgementModalTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(judgementModalBackgroundOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowJudgementModal(false);
      judgementModalTranslateY.setValue(SCREEN_HEIGHT);
    });
  };

  // 판정 제출
  const handleSubmitJudgement = async () => {
    if (!archiveDetail || !judgementType) return;

    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        closeJudgementModal();
        setShowLoginRequiredModal(true);
        return;
      }

      setIsSubmittingJudgement(true);

      const price = judgementPrice ? parseInt(judgementPrice.replace(/,/g, '')) : undefined;
      if (price && price > 100000000) {
        Alert.alert('오류', '평가 가격은 최대 1억원까지 입력 가능합니다.');
        setIsSubmittingJudgement(false);
        return;
      }

      await archiveAPI.createJudgement(
        archiveDetail.archiveId,
        {
          isArchive: judgementType === 'archive',
          comment: judgementComment.trim() || undefined,
          price: price,
        },
        accessToken
      );

      // 성공 시 상세 정보 다시 로드 (캐시 무시)
      await loadArchiveDetail(true);
      
      Alert.alert('성공', '판정이 등록되었습니다.');
      closeJudgementModal();
    } catch (error: any) {
      console.error('판정 등록 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '판정 등록에 실패했습니다.');
    } finally {
      setIsSubmittingJudgement(false);
    }
  };

  const handleInterestToggle = async () => {
    if (!archiveDetail) return;
    
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        Alert.alert('알림', '로그인이 필요합니다.');
        setShowMenu(false);
        return;
      }

      const currentIsInterest = archiveDetail.isInterest ?? false;
      
      if (currentIsInterest) {
        // 관심 아카이브 해제
        await archiveAPI.removeInterestArchive(archiveDetail.archiveId, accessToken);
        const updatedDetail = { ...archiveDetail, isInterest: false };
        setArchiveDetail(updatedDetail);
        setCache(archiveDetail.archiveId, updatedDetail);
        Alert.alert('알림', '관심 아카이브에서 해제되었습니다.');
      } else {
        // 관심 아카이브 등록
        await archiveAPI.addInterestArchive(archiveDetail.archiveId, accessToken);
        const updatedDetail = { ...archiveDetail, isInterest: true };
        setArchiveDetail(updatedDetail);
        setCache(archiveDetail.archiveId, updatedDetail);
        Alert.alert('알림', '관심 아카이브에 등록되었습니다.');
      }
    } catch (error: any) {
      console.error('관심 아카이브 등록/해제 실패:', error);
      Alert.alert('오류', error.response?.data?.message || '관심 아카이브 등록/해제에 실패했습니다.');
    } finally {
      setShowMenu(false);
    }
  };

  const handleReport = async () => {
    setShowMenu(false);
    Alert.alert('알림', '신고 기능은 추후 구현 예정입니다.');
  };

  const handleEdit = async () => {
    setShowMenu(false);
    // 현재 경로 저장
    const currentPath = `/archive-detail/${id}`;
    await AsyncStorage.setItem('previousRoute', currentPath);
    router.push(`/archive-edit/${id}`);
  };

  const handleDelete = () => {
    setShowMenu(false);
    Alert.alert(
      '게시물 삭제',
      '정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            Alert.alert('알림', '삭제 기능은 추후 구현 예정입니다.');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2F2F2F" />
      </SafeAreaView>
    );
  }

  if (!archiveDetail) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* 헤더 */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <TouchableOpacity onPress={handleBackPress} className="p-2">
          <ChevronLeft size={28} color="#2F2F2F" />
        </TouchableOpacity>
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            className="p-2"
            onPress={() => router.push('/interest')}
          >
            <Tag size={24} color="#2F2F2F" />
          </TouchableOpacity>
          <View className="relative">
            <TouchableOpacity 
              className="p-2"
              onPress={() => router.push('/alarm')}
            >
              <Bell size={24} color="#2F2F2F" />
            </TouchableOpacity>
            {alarmCount > 0 && (
              <View className="absolute right-1 top-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                <Text className="text-white text-xs font-bold">{alarmCount > 99 ? '99+' : alarmCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={handleMenuPress} className="p-2">
            <MoreVertical size={24} color="#2F2F2F" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { 
            useNativeDriver: false,
            listener: (event: any) => {
              setScrollOffset(event.nativeEvent.contentOffset.y);
            }
          }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2F2F2F"
            colors={['#2F2F2F']}
          />
        }
      >
        {/* 이미지 슬라이더 */}
        <Animated.View style={{ height: 360, opacity: imageOpacity }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const index = Math.round(offsetX / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
          >
            {archiveDetail.imageUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: getCachedImageUrl(url) }}
                style={{ width: SCREEN_WIDTH, height: 360 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ))}
          </ScrollView>
          
          {/* 페이지 인디케이터 */}
          {archiveDetail.imageUrls.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {archiveDetail.imageUrls.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index === currentImageIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </View>
          )}
        </Animated.View>

        {/* 컨텐츠 */}
        <View className="px-6 pt-4 pb-20">
          {/* ARCHIVE DETAILS 컨테이너 - 테두리 포함 */}
          <View 
            style={{ 
              borderWidth: 1,
              borderColor: '#EDEDED',
              borderRadius: 15,
              padding: 16,
              marginBottom: 16
            }}
          >
            <Text 
              style={{ 
                color: '#2F2F2F', 
                fontSize: 22,
                fontWeight: '700',
                marginBottom: 16
              }}
            >
              ARCHIVE DETAILS
            </Text>

          {/* 브랜드, 타임라인, 카테고리 - 버튼 스타일 */}
          <View className="flex-row mb-5" style={{ justifyContent: 'space-evenly' }}>
            <View className="flex-1 items-center">
              <View 
                className="px-4 py-2 rounded-full mb-2"
                style={{ 
                  backgroundColor: 'white', 
                  borderWidth: 1,
                  borderColor: '#EDEDED'
                }}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <RNImage 
                    source={require('../../assets/images/Bold.png')} 
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: '#888', fontSize: 12 }}>Brand</Text>
                </View>
              </View>
              <View className="w-full items-center">
                <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '200', textAlign: 'center', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {archiveDetail.brand}
                </Text>
                <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
              </View>
            </View>

            <View className="flex-1 items-center">
              <View 
                className="px-4 py-2 rounded-full mb-2"
                style={{ 
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#EDEDED'
                }}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <RNImage 
                    source={require('../../assets/images/Fast forward.png')} 
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: '#888', fontSize: 12 }}>TimeLine</Text>
                </View>
              </View>
              <View className="w-full items-center">
                <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '200', textAlign: 'center', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {archiveDetail.timeline}
                </Text>
                <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
              </View>
            </View>

            <View className="flex-1 items-center">
              <View 
                className="px-4 py-2 rounded-full mb-2"
                style={{ 
                  backgroundColor: 'white',
                  borderWidth: 1,
                  borderColor: '#EDEDED'
                }}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <RNImage 
                    source={require('../../assets/images/List.png')} 
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: '#888', fontSize: 12 }}>Category</Text>
                </View>
              </View>
              <View className="w-full items-center">
                <Text style={{ color: '#2F2F2F', fontSize: 16, fontWeight: '200', textAlign: 'center', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {archiveDetail.category}
                </Text>
                <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
              </View>
            </View>
          </View>

          {/* 평균 평가 가격 */}
          <View className="mb-6">
            <Text 
              style={{ 
                color: '#2F2F2F', 
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 16
              }}
            >
              평균 평가 가격
            </Text>
            <View>
              {archiveDetail.averagePrice ? (
                <>
                  <Text 
                    style={{ 
                      color: '#2F2F2F', 
                      fontSize: 20,
                      fontWeight: '300',
                      letterSpacing: 1,
                      marginBottom: 10,
                      textAlign: 'right',
                      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
                    }}
                  >
                    ₩ {displayPrice.toLocaleString()}
                  </Text>
                  <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
                </>
              ) : (
                <>
                  <Text 
                    style={{ 
                      color: '#737373', 
                      fontSize: 14,
                      fontWeight: '400',
                      marginBottom: 10,
                      textAlign: 'right'
                    }}
                  >
                    평가를 기다리고 있어요.
                  </Text>
                  <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
                </>
              )}
            </View>
          </View>

          {/* 스토리 */}
          <View className="mb-6">
            <Text 
              style={{ 
                color: '#2F2F2F', 
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 12
              }}
            >
              스토리
            </Text>
            <View>
              {/* 줄 수 측정용 텍스트 (숨김, numberOfLines 없이) */}
              {!storyMeasured && !isStoryExpanded && archiveDetail.story && (
                <Text
                  style={{
                    position: 'absolute',
                    opacity: 0,
                    fontSize: 14,
                    lineHeight: 26,
                    width: SCREEN_WIDTH - 48 - 32,
                    pointerEvents: 'none',
                  }}
                  onTextLayout={(e) => {
                    const lineCount = e.nativeEvent.lines.length;
                    if (lineCount > 2) {
                      setIsStoryTruncated(true);
                    } else {
                      setIsStoryTruncated(false);
                    }
                    setStoryMeasured(true);
                  }}
                >
                  {archiveDetail.story}
                </Text>
              )}
              <Text 
                style={{ 
                  color: '#2F2F2F', 
                  fontSize: 14,
                  lineHeight: 26,
                  fontWeight: '500'
                }}
                numberOfLines={isStoryExpanded ? undefined : 2}
                ellipsizeMode="tail"
              >
                {archiveDetail.story}
              </Text>
              {isStoryTruncated && (
                <TouchableOpacity 
                  onPress={() => setIsStoryExpanded(!isStoryExpanded)} 
                  className="mt-2"
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 14, color: '#2F2F2F', fontWeight: '200' }}>
                    {isStoryExpanded ? '접기 ▴' : '더보기 ▾'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 작성자 정보 */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center mr-3"
                style={{ 
                  backgroundColor: '#E5E5E5',
                  width: 40,
                  height: 40
                }}
              >
                {archiveDetail.authorImageUrl ? (
                  <Image
                    source={{ uri: getCachedImageUrl(archiveDetail.authorImageUrl) }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    cachePolicy="memory-disk"
                    transition={200}
                  />
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#2F2F2F' }}>
                    {archiveDetail.authorNickname[0]}
                  </Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '400', color: '#2F2F2F' }}>
                {archiveDetail.authorNickname}
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#2F2F2F' }}>{archiveDetail.publishedAt}</Text>
          </View>
          </View>

          {/* 판정 결과 또는 버튼 */}
          {!isAuthor && (
            <>
              {archiveDetail.isJudged && archiveDetail.myJudgement ? (
                /* 판정 완료 상태 */
                <View className="mb-6">
                  {/* ARCHIVE 또는 DE-ARCHIVE 표시 */}
                  <View className="flex-row items-center mb-4">
                    {archiveDetail.myJudgement.isArchive ? (
                      <>
                        <Tag size={24} color="#3CBC7B" strokeWidth={2.5} />
                        <Text 
                          style={{ 
                            color: '#3CBC7B', 
                            fontSize: 18, 
                            fontWeight: '700',
                            marginLeft: 8
                          }}
                        >
                          ARCHIVE
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={{ color: '#E25F48', fontSize: 24, fontWeight: '700', marginRight: 4 }}>✕</Text>
                        <Text
                          style={{ 
                            color: '#E25F48', 
                            fontSize: 18, 
                            fontWeight: '700'
                          }}
                        >
                          DE-ARCHIVE
                        </Text>
                      </>
                    )}
                  </View>

                  {/* 회원님의 평가 금액 (ARCHIVE 판정일 경우에만) */}
                  {archiveDetail.myJudgement.isArchive && archiveDetail.myJudgement.price && (
                    <View className="flex-row items-center justify-between">
                      <Text 
                        style={{ 
                          color: '#2F2F2F', 
                          fontSize: 16,
                          fontWeight: '600'
                        }}
                      >
                        회원님의 평가 금액
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text 
                          style={{ 
                            color: '#2F2F2F', 
                            fontSize: 18,
                            fontWeight: '300',
                            letterSpacing: 1,
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            marginBottom: 8
                          }}
                        >
                          ₩ {archiveDetail.myJudgement.price.toLocaleString()}
                        </Text>
                        <View style={{ height: 1, backgroundColor: '#EDEDED', width: '100%' }} />
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                /* 판정 전 상태 - 버튼 표시 */
                <View className="flex-row gap-3 mb-6">
                  <TouchableOpacity
                    onPress={() => openJudgementModal('archive')}
                    className="flex-1 rounded-full flex-row items-center justify-center"
                    style={{ 
                      backgroundColor: '#3CBC7B',
                      paddingVertical: 16,
                      paddingHorizontal: 20
                    }}
                  >
                    <Tag size={22} color="white" strokeWidth={2.5} />
                    <Text 
                      style={{ 
                        color: 'white', 
                        fontSize: 16, 
                        fontWeight: '700',
                        marginLeft: 8
                      }}
                    >
                      ARCHIVE IT
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openJudgementModal('de-archive')}
                    className="flex-1 rounded-full flex-row items-center justify-center"
                    style={{ 
                      backgroundColor: '#E25F48',
                      paddingVertical: 16,
                      paddingHorizontal: 20
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 22, fontWeight: '700', marginRight: 4 }}>✕</Text>
                    <Text 
                      style={{ 
                        color: 'white', 
                        fontSize: 16, 
                        fontWeight: '700'
                      }}
                    >
                      DE-ARCHIVE IT
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* 댓글 섹션 */}
          <TouchableOpacity 
            className="mb-6" 
            activeOpacity={0.8}
            onPress={() => setShowCommentsModal(true)}
          >
            <Text 
              style={{ 
                color: '#2F2F2F', 
                fontSize: 18,
                fontWeight: '700',
                marginBottom: 16
              }}
            >
              Comments
            </Text>
            
            {/* 댓글 컨테이너 */}
            <View style={{ paddingHorizontal: 16 }}>
              {(() => {
                const isArchiveFilter = commentFilter === 'archive';
                
                const myComment = archiveDetail.isJudged && 
                                  archiveDetail.myJudgement?.comment && 
                                  archiveDetail.myJudgement.isArchive === isArchiveFilter
                  ? {
                      judgementId: 'my-comment',
                      memberNickname: userNickname,
                      memberImageUrl: undefined,
                      comment: archiveDetail.myJudgement.comment,
                      isArchive: archiveDetail.myJudgement.isArchive,
                      publishedAt: '방금',
                      isMine: true
                    }
                  : null;
                
                const otherComments = comments.filter(
                  (c) => c.isArchive === isArchiveFilter && (!userId || c.memberId !== userId)
                );
                
                const allComments = myComment 
                  ? [myComment, ...otherComments]
                  : otherComments;

                  if (allComments.length === 0) {
                    return (
                      <View 
                        style={{ 
                          backgroundColor: '#F5F5F5', 
                          position: 'relative',
                          paddingVertical: 32,
                          paddingHorizontal: 20,
                          borderRadius: 10
                        }}
                      >
                        {/* 인디케이터 */}
                        <View 
                          style={{ 
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            flexDirection: 'row',
                            gap: 8
                          }}
                        >
                          <View 
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: commentFilter === 'archive' ? '#3CBC7B' : '#E5E5E5'
                            }}
                          />
                          <View 
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: commentFilter === 'de-archive' ? '#E25F48' : '#E5E5E5'
                            }}
                          />
                        </View>
                        
                        <Text 
                          style={{ 
                            fontSize: 13, 
                            color: '#999', 
                            textAlign: 'center',
                            lineHeight: 20
                          }}
                        >
                          코멘트가 없습니다. 판정과 함께 코멘트를 남겨보세요!
                        </Text>
                      </View>
                    );
                  }

                  return allComments.map((comment, index) => (
                    <View 
                      key={comment.judgementId}
                      className="mb-3 p-4 rounded-2xl"
                      style={{ backgroundColor: '#F5F5F5', position: 'relative' }}
                    >
                      {/* 인디케이터 (첫 번째 댓글에만 표시) */}
                      {index === 0 && (
                        <View 
                          style={{ 
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            flexDirection: 'row',
                            gap: 8
                          }}
                        >
                          <View 
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: commentFilter === 'archive' ? '#3CBC7B' : '#E5E5E5'
                            }}
                          />
                          <View 
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 5,
                              backgroundColor: commentFilter === 'de-archive' ? '#E25F48' : '#E5E5E5'
                            }}
                          />
                        </View>
                      )}
                      
                      <View className="flex-row">
                        <View 
                          className="rounded-full items-center justify-center mr-3" 
                          style={{ 
                            backgroundColor: '#E5E5E5',
                            width: 44,
                            height: 44
                          }}
                        >
                          {comment.memberImageUrl ? (
                            <Image
                              source={{ uri: getCachedImageUrl(comment.memberImageUrl) }}
                              style={{ width: 44, height: 44, borderRadius: 22 }}
                              cachePolicy="memory-disk"
                              transition={200}
                            />
                          ) : (
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2F2F2F' }}>
                              {comment.memberNickname[0]}
                            </Text>
                          )}
                        </View>
                        <View className="flex-1" style={{ paddingRight: index === 0 ? 60 : 0 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#2F2F2F', marginBottom: 8 }}>
                            {comment.memberNickname}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#2F2F2F', lineHeight: 20 }}>
                            {comment.comment}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ));
                })()}
              </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

      {/* 하단 네비게이션 바 */}
      <NavigationBar />

      {/* 댓글 모달 */}
      <Modal
        visible={showCommentsModal}
        animationType="none"
        transparent={true}
        onRequestClose={() => {
          Animated.parallel([
            Animated.timing(modalTranslateY, {
              toValue: 1000,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(modalBackgroundOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ]).start(() => {
            setShowCommentsModal(false);
            modalTranslateY.setValue(0);
            modalBackgroundOpacity.setValue(0);
          });
        }}
      >
        <Animated.View 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
            opacity: modalBackgroundOpacity
          }}
        >
          <TouchableOpacity 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
            activeOpacity={1}
            onPress={() => {
              Animated.parallel([
                Animated.timing(modalTranslateY, {
                  toValue: 1000,
                  duration: 300,
                  useNativeDriver: true,
                }),
                Animated.timing(modalBackgroundOpacity, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                })
              ]).start(() => {
                setShowCommentsModal(false);
                modalTranslateY.setValue(0);
                modalBackgroundOpacity.setValue(0);
              });
            }}
          />
          <Animated.View
            style={{ 
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: '90%',
              transform: [{ translateY: modalTranslateY }],
            }}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              {/* 스와이프 바 */}
              <View 
                style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}
                {...headerPanResponder.panHandlers}
              >
                <View 
                  style={{ 
                    width: 40, 
                    height: 4, 
                    backgroundColor: '#E5E5E5', 
                    borderRadius: 2 
                  }} 
                />
              </View>

              {/* 모달 헤더 */}
              <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
              <View 
                className="flex-row items-center justify-between mb-4"
                {...headerPanResponder.panHandlers}
              >
                <TouchableOpacity onPress={() => {
                  Animated.parallel([
                    Animated.timing(modalTranslateY, {
                      toValue: 1000,
                      duration: 300,
                      useNativeDriver: true,
                    }),
                    Animated.timing(modalBackgroundOpacity, {
                      toValue: 0,
                      duration: 300,
                      useNativeDriver: true,
                    })
                  ]).start(() => {
                    setShowCommentsModal(false);
                    modalTranslateY.setValue(0);
                    modalBackgroundOpacity.setValue(0);
                  });
                }}>
                  <ChevronLeft size={28} color="#2F2F2F" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#2F2F2F', flex: 1, textAlign: 'center' }}>
                  Comments
                </Text>
                <View style={{ width: 28 }} />
              </View>

              {/* 아카이빙/디아카이빙 탭 */}
              <View className="flex-row gap-2" style={{ justifyContent: 'flex-start' }}>
                <TouchableOpacity
                  onPress={() => {
                    setModalCommentFilter('archive');
                    commentSwipeScrollViewRef.current?.scrollTo({ x: 0, animated: true });
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: '#3CBC7B',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: modalCommentFilter === 'archive' ? 1 : 0.4
                  }}
                >
                  <Tag size={16} color={'white'} strokeWidth={2.5} />
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: 'white'
                  }}>
                    아카이빙
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setModalCommentFilter('de-archive');
                    commentSwipeScrollViewRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    backgroundColor: '#E25F48',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: modalCommentFilter === 'de-archive' ? 1 : 0.4
                  }}
                >
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '700', 
                    color: 'white',
                    marginRight: 2
                  }}>
                    ✕
                  </Text>
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: 'white',
                  }}>
                    디아카이빙
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 댓글 리스트 - 스와이프 가능 */}
            <ScrollView
              ref={commentSwipeScrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const page = Math.round(offsetX / SCREEN_WIDTH);
                setModalCommentFilter(page === 0 ? 'archive' : 'de-archive');
              }}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="start"
            >
              {/* 아카이브 판정 댓글 페이지 */}
              <ScrollView 
                style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {(() => {
                  const isArchiveFilter = true; // 아카이브 필터
                
                // 내 코멘트
                const myComment = archiveDetail?.isJudged && 
                                  archiveDetail.myJudgement?.comment && 
                                  archiveDetail.myJudgement.isArchive === isArchiveFilter
                  ? {
                      judgementId: 'my-comment',
                      memberNickname: userNickname,
                      memberImageUrl: undefined,
                      comment: archiveDetail.myJudgement.comment,
                      isArchive: archiveDetail.myJudgement.isArchive,
                      createdAt: '방금',
                      memberId: userId || '',
                      isMine: true
                    }
                  : null;
                
                // 다른 사람들의 코멘트
                const otherComments = comments.filter(
                  (c) => c.isArchive === isArchiveFilter && 
                         (!userId || c.memberId !== userId)
                );
                
                const allComments = myComment 
                  ? [myComment, ...otherComments]
                  : otherComments;

                if (allComments.length === 0) {
                  return (
                    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, color: '#999' }}>
                        판정 코멘트가 존재하지 않습니다.
                      </Text>
                    </View>
                  );
                }

                return allComments.map((comment) => (
                  <View 
                    key={comment.judgementId}
                    className="mb-4 pb-4"
                    style={{ borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}
                  >
                    <View className="flex-row">
                      <View 
                        className="rounded-full items-center justify-center mr-3" 
                        style={{ 
                          backgroundColor: '#E5E5E5',
                          width: 44,
                          height: 44
                        }}
                      >
                        {comment.memberImageUrl ? (
                          <Image
                            source={{ uri: comment.memberImageUrl }}
                            style={{ width: 44, height: 44, borderRadius: 22 }}
                          />
                        ) : (
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#2F2F2F' }}>
                            {comment.memberNickname[0]}
                          </Text>
                        )}
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-2">
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#2F2F2F' }}>
                            {comment.memberNickname}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#999' }}>
                            {comment.createdAt}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#2F2F2F', lineHeight: 20 }}>
                          {comment.comment}
                        </Text>
                      </View>
                    </View>
                  </View>
                ));
              })()}
              </ScrollView>

              {/* 디아카이브 판정 댓글 페이지 */}
              <ScrollView 
                style={{ width: SCREEN_WIDTH, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {(() => {
                  const isArchiveFilter = false; // 디아카이브 필터
                  
                  // 내 코멘트
                  const myComment = archiveDetail?.isJudged && 
                                    archiveDetail.myJudgement?.comment && 
                                    archiveDetail.myJudgement.isArchive === isArchiveFilter
                    ? {
                        judgementId: 'my-comment',
                        memberNickname: userNickname,
                        memberImageUrl: undefined,
                        comment: archiveDetail.myJudgement.comment,
                        isArchive: archiveDetail.myJudgement.isArchive,
                        createdAt: '방금',
                        memberId: userId || '',
                        isMine: true
                      }
                    : null;
                  
                  // 다른 사람들의 코멘트
                  const otherComments = comments.filter(
                    (c) => c.isArchive === isArchiveFilter && 
                           (!userId || c.memberId !== userId)
                  );
                  
                  const allComments = myComment 
                    ? [myComment, ...otherComments]
                    : otherComments;

                  if (allComments.length === 0) {
                    return (
                      <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: '#999' }}>
                          판정 코멘트가 존재하지 않습니다.
                        </Text>
                      </View>
                    );
                  }

                  return allComments.map((comment) => (
                    <View 
                      key={comment.judgementId}
                      className="mb-4 pb-4"
                      style={{ borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }}
                    >
                      <View className="flex-row">
                        <View 
                          className="rounded-full items-center justify-center mr-3" 
                          style={{ 
                            backgroundColor: '#E5E5E5',
                            width: 44,
                            height: 44
                          }}
                        >
                          {comment.memberImageUrl ? (
                            <Image
                              source={{ uri: getCachedImageUrl(comment.memberImageUrl) }}
                              style={{ width: 44, height: 44, borderRadius: 22 }}
                              cachePolicy="memory-disk"
                              transition={200}
                            />
                          ) : (
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2F2F2F' }}>
                              {comment.memberNickname[0]}
                            </Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-2">
                            <Text style={{ fontSize: 15, fontWeight: '600', color: '#2F2F2F' }}>
                              {comment.memberNickname}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#999' }}>
                              {comment.createdAt}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 14, color: '#2F2F2F', lineHeight: 20 }}>
                            {comment.comment}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ));
                })()}
              </ScrollView>
            </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* 점 3개 메뉴 모달 */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6">
            {isAuthor ? (
              /* 작성자인 경우 - 게시물 수정/삭제만 표시 */
              <>
                <TouchableOpacity
                  onPress={handleEdit}
                  className="py-4 border-b border-gray-100"
                >
                  <Text className="text-center text-blue-500 text-base">
                    게시물 수정
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDelete}
                  className="py-4"
                >
                  <Text className="text-center text-blue-500 text-base">
                    게시물 삭제
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* 작성자가 아닌 경우 */
              <>
                <TouchableOpacity
                  onPress={handleInterestToggle}
                  className="py-4 border-b border-gray-100"
                >
                  <Text className="text-center text-blue-500 text-base">
                    {archiveDetail?.isInterest ? '관심 아카이브 해제' : '관심 아카이브 등록'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleReport}
                  className="py-4"
                >
                  <Text className="text-center text-blue-500 text-base">
                    게시물 신고
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 판정 모달 */}
      <Modal
        visible={showJudgementModal}
        animationType="none"
        transparent={true}
        onRequestClose={closeJudgementModal}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
            opacity: judgementModalBackgroundOpacity,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={closeJudgementModal}
          />
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 24,
              paddingBottom: insets.bottom,
              maxHeight: '90%',
              transform: [{ translateY: judgementModalTranslateY }],
            }}
          >
            <SafeAreaView edges={['bottom']}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
              >
                {/* 판정 메시지 */}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: judgementType === 'archive' ? '#3CBC7B' : '#E25F48',
                    marginBottom: 24,
                  }}
                >
                  {judgementType === 'archive'
                    ? '가치 있는 아카이브로 판정합니다.'
                    : '가치 있는 아카이브로 판정하지 않습니다.'}
                </Text>

                {/* 코멘트 입력 */}
                <View className="mb-6" style={{ position: 'relative' }}>
                  <TextInput
                    placeholder="판정에 관한 코멘트를 적어주세요. (선택)"
                    placeholderTextColor="#999"
                    value={judgementComment}
                    onChangeText={(text) => {
                      if (text.length <= 500) {
                        setJudgementComment(text);
                      }
                    }}
                    multiline
                    numberOfLines={6}
                    style={{
                      backgroundColor: '#F5F5F5',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 14,
                      color: '#2F2F2F',
                      minHeight: 140,
                      textAlignVertical: 'top',
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: '#999',
                      position: 'absolute',
                      bottom: 12,
                      right: 16,
                    }}
                  >
                    {judgementComment.length}/500
                  </Text>
                </View>

                {/* 평가 가격 입력 - 아카이빙일 때만 표시 */}
                {judgementType === 'archive' && (
                  <View className="mb-8">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text style={{ fontSize: 16, fontWeight: '600', color: '#2F2F2F' }}>
                        평가 가격 (선택)
                      </Text>
                      <Text style={{ fontSize: 12, color: '#999' }}>
                        최대 1억까지 입력 가능합니다.
                      </Text>
                    </View>
                    <View style={{ 
                      borderBottomWidth: 1, 
                      borderBottomColor: '#EDEDED', 
                      paddingBottom: 8,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <TextInput
                        placeholder="평가 가격을 입력해주세요."
                        placeholderTextColor="#999"
                        value={judgementPrice ? judgementPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                        onChangeText={(text) => {
                          // 숫자만 입력 허용
                          const numericValue = text.replace(/[^0-9]/g, '');
                          if (numericValue === '' || parseInt(numericValue) <= 100000000) {
                            setJudgementPrice(numericValue);
                          }
                        }}
                        keyboardType="numeric"
                        style={{
                          fontSize: 14,
                          color: '#2F2F2F',
                          paddingVertical: 8,
                          flex: 1,
                        }}
                      />
                      {judgementPrice && (
                        <Text style={{ 
                          fontSize: 14,
                          color: '#2F2F2F',
                          marginLeft: 4,
                        }}>
                          원
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* 버튼 */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={closeJudgementModal}
                    className="flex-1 rounded-lg"
                    style={{
                      backgroundColor: 'white',
                      borderWidth: 1,
                      borderColor: '#2F2F2F',
                      paddingVertical: 16,
                      alignItems: 'center',
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#2F2F2F' }}>
                      취소
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSubmitJudgement}
                    disabled={isSubmittingJudgement}
                    className="flex-1 rounded-lg"
                    style={{
                      backgroundColor: '#2F2F2F',
                      paddingVertical: 16,
                      alignItems: 'center',
                      borderRadius: 12,
                      opacity: isSubmittingJudgement ? 0.6 : 1,
                    }}
                  >
                    {isSubmittingJudgement ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                        평가하기
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* 비로그인 팝업 */}
      <Modal
        visible={showLoginRequiredModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowLoginRequiredModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            activeOpacity={1}
            onPress={() => setShowLoginRequiredModal(false)}
          />
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 24,
              width: '100%',
              maxWidth: 320,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#2F2F2F',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              로그인이 필요합니다.
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#666',
                marginBottom: 24,
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              로그인 하고 감정 평가를 남겨보세요.
            </Text>
            <TouchableOpacity
              onPress={() => setShowLoginRequiredModal(false)}
              style={{
                backgroundColor: '#2F2F2F',
                paddingVertical: 14,
                paddingHorizontal: 32,
                borderRadius: 8,
                width: '100%',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white',
                }}
              >
                확인
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
