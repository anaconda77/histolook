import { View, Text, ScrollView } from 'react-native';
import { Sparkles, Moon, Palette } from 'lucide-react-native';

/**
 * NativeWind Example Component
 * This component demonstrates how to use NativeWind with TypeScript
 */
export default function NativeWindExample() {
  return (
    <ScrollView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 items-center justify-center p-6">
        <View className="bg-primary-500 rounded-2xl p-8 shadow-lg mb-6">
          <View className="flex-row items-center mb-4">
            <Sparkles size={32} color="white" />
            <Text className="text-white text-2xl font-bold ml-3">
              NativeWind v4
            </Text>
          </View>
          <Text className="text-white/90 text-base">
            Tailwind CSS is now configured!
          </Text>
        </View>
        
        <View className="w-full space-y-3">
          <View className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg flex-row items-center">
            <Palette size={24} color="#1e3a8a" className="dark:text-blue-100" />
            <Text className="text-blue-900 dark:text-blue-100 font-semibold ml-3">
              Use className prop
            </Text>
          </View>
          
          <View className="bg-green-100 dark:bg-green-900 p-4 rounded-lg flex-row items-center">
            <Moon size={24} color="#14532d" className="dark:text-green-100" />
            <Text className="text-green-900 dark:text-green-100 font-semibold ml-3">
              Dark mode support
            </Text>
          </View>
          
          <View className="bg-purple-100 dark:bg-purple-900 p-4 rounded-lg">
            <Text className="text-purple-900 dark:text-purple-100 font-semibold">
              TypeScript ready ✨
            </Text>
            <Text className="text-purple-700 dark:text-purple-300 text-sm mt-2">
              Full type safety with className prop
            </Text>
          </View>
        </View>

        <View className="mt-8 w-full">
          <Text className="text-gray-800 dark:text-gray-200 text-center text-sm">
            Edit components to see changes
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

