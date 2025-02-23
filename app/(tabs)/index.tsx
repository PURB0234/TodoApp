import { View } from "react-native";
import FormLogin from '@/app/(tabs)/Login'
import Home from '@/app/(tabs)/Home'
import * as Notifications from "expo-notifications";

 Notifications.setNotificationHandler({
   handleNotification: async () => ({
     shouldShowAlert: true,
     shouldPlaySound: true,
     shouldSetBadge: false,
   }),
 }); 

export default function App() {
  return (
    <View style={{
      height: '100%'
    }}>
      <FormLogin />
    </View>
  )
}