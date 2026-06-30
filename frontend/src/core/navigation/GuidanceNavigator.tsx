import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GuidanceScreen from '../../features/guidance/screens/GuidanceScreen';
import ExerciseListScreen from '../../features/guidance/screens/ExerciseListScreen';

export type GuidanceStackParamList = {
  GuidanceHome: undefined;
  Chatbot: undefined;
  Exercises: undefined;
};

const Stack = createStackNavigator<GuidanceStackParamList>();

export const GuidanceNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GuidanceHome" component={GuidanceScreen} />
      <Stack.Screen name="Exercises" component={ExerciseListScreen} />
    </Stack.Navigator>
  );
};

export default GuidanceNavigator;
