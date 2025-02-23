import { doc, updateDoc, deleteField } from "firebase/firestore";
import { Alert } from "react-native";
import { db } from "@/service/firebaseConfig";
import * as Notifications from "expo-notifications";

interface Tugas {
  [x: string]: any;
  id: string;
  deadline?: string | null;
}

export const handleHapusDeadline = async (
  selectedTugas: Tugas | null,
  setSelectedTugas: (tugas: Tugas | null) => void,
  setIsVisible: (visible: boolean) => void
) => {
  if (!selectedTugas?.id) return;

  try {
    const tugasDocRef = doc(db, "tdl", selectedTugas.id);
    await updateDoc(tugasDocRef, {
      deadline: deleteField(),
    });

    await Notifications.cancelAllScheduledNotificationsAsync();

    setSelectedTugas(null);
    setIsVisible(false);
    Alert.alert("Sukses", "Deadline berhasil dihapus dan notifikasi dibatalkan!");
  } catch (error) {
    console.error("Error menghapus deadline:", error);
    Alert.alert("Error", "Gagal menghapus deadline!");
  }
};

export const handleSimpanDeadline = async (
  selectedTugas: Tugas | null,
  tanggal: Date,
  waktu: Date,
  setSelectedTugas: (tugas: Tugas | null) => void,
  setIsVisible: (visible: boolean) => void
) => {
  if (!selectedTugas) return;

  const combinedDateTime = new Date(
    tanggal.getFullYear(),
    tanggal.getMonth(),
    tanggal.getDate(),
    waktu.getHours(),
    waktu.getMinutes(),
    0
  );

  const notificationTime = new Date(combinedDateTime.getTime() - 2 * 60 * 1000);

  try {
    const tugasDocRef = doc(db, "tdl", selectedTugas.id);
    await updateDoc(tugasDocRef, { deadline: combinedDateTime.toISOString() });

    setSelectedTugas({ ...selectedTugas, deadline: combinedDateTime.toISOString() });
    setIsVisible(false);

    const now = new Date();
    const secondsUntilNotification = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);

    await Notifications.cancelAllScheduledNotificationsAsync();

    console.log("⏳ Deadline:", combinedDateTime.toLocaleString());
    console.log("🔔 Notifikasi dijadwalkan pada:", notificationTime.toLocaleString());
    console.log(`⏳ Notifikasi akan muncul dalam ${secondsUntilNotification} detik`);

    if (notificationTime > now) {
      const trigger: any = { seconds: secondsUntilNotification}
      setTimeout(() => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: `${selectedTugas.judulTugas} 📅`,
          body: `Deadline tugas pada ${combinedDateTime.toLocaleString()}. Kerjain hei tugasnya kamu ini 😡😤`,
          sound: "default",
        },
        trigger: trigger, 
      });
    }, secondsUntilNotification * 1000)

      Alert.alert("Sukses", "Deadline berhasil disimpan & notifikasi dijadwalkan.");
    } else {
      console.warn("Deadline sudah lewat, tidak menjadwalkan notifikasi.");
    }
  } catch (error) {
    console.error("Error menyimpan deadline:", error);
    Alert.alert("Error", "Gagal menyimpan deadline.");
  }
};
