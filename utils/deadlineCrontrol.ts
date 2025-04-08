import { doc, updateDoc, deleteField, setDoc } from "firebase/firestore";
import { Alert, ToastAndroid } from "react-native";
import { db } from "@/service/firebaseConfig";
import * as Notifications from "expo-notifications";
import { AppState } from "react-native";
import * as TaskManager from "expo-task-manager";

interface Tugas {
  [x: string]: any;
  id: string;
  deadline?: string | null;
}

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: { data: { title: string; body: string }; error: any }) => {
  if (error) {
    console.error("Error in background task:", error);
    return;
  }
  const { title, body } = data;
  await Notifications.presentNotificationAsync({
    title,
    body,
    sound: "default",
  });
});

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
    // Alert.alert("Sukses", "Deadline berhasil dihapus dan notifikasi dibatalkan!");
    ToastAndroid.show('Pengingat dibatalkan.', ToastAndroid.SHORT);
  } catch (error) {
    console.error("Error menghapus deadline:", error);
    Alert.alert("Error", "Gagal menghapus deadline!");
  }
};

export async function handleSimpanDeadline(selectedTugas: { id?: string; judulTugas: string; },
  tanggal: Date,
  waktu: Date,
  setSelectedTugas: (tugas: Tugas | null) => void,
  setIsVisible: (visible: boolean) => void) {
  if (!selectedTugas?.id) return;

  const combinedDateTime = new Date(
    tanggal.getFullYear(),
    tanggal.getMonth(),
    tanggal.getDate(),
    waktu.getHours(),
    waktu.getMinutes(),
    0
  );

  const notificationTime = new Date(combinedDateTime.getTime() - 2 * 60 * 1000);
  const now = new Date();
  const timeDiffMs = notificationTime.getTime() - now.getTime();

  console.log("⏳ Deadline:", combinedDateTime.toLocaleString());
  console.log("🔔 Notifikasi dijadwalkan pada:", notificationTime.toLocaleString());
  console.log(`🕒 Selisih waktu hingga notifikasi: ${timeDiffMs / 1000} detik`);

  try {
    const tugasDocRef = doc(db, "tdl", selectedTugas.id);
    await setDoc(tugasDocRef, {
      deadline: combinedDateTime.toISOString(),
    }, { merge: true });

    console.log("✅ Deadline tersimpan di Firestore!");
    ToastAndroid.show('Pengingat ditambahkan.', ToastAndroid.SHORT);
  } catch (error) {
    console.error("❌ Gagal menyimpan deadline ke Firestore:", error);
    return;
  }

  if (timeDiffMs > 0) {
    if (AppState.currentState === "background") {
      console.log("🔵 Aplikasi di background atau tidak aktif, menggunakan scheduleNotificationAsync...");
      const trigger: any = { date: notificationTime };
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${selectedTugas.judulTugas} 📅`,
          body: `Deadline tugas pada ${combinedDateTime.toLocaleString()}. Jangan lupa untuk mengerjakan tugasmu tetap semangat menjalani hari-harimu dengan senyum caramelku 😊😇`,
          sound: "default",
        },
        trigger: trigger,
      });
    } else if (AppState.currentState == "active") {
      console.log("🟢 Aplikasi aktif, menggunakan setTimeout...");
      setTimeout(() => {
        Notifications.presentNotificationAsync({
          title: `${selectedTugas.judulTugas} 📅`,
          body: `Deadline tugas pada ${combinedDateTime.toLocaleString()}. Jangan lupa untuk mengerjakan tugasmu tetap semangat menjalani hari-harimu dengan senyum caramelku 😊😇`,
          sound: "default",
        });
        console.log("🔔 Notifikasi ditampilkan lewat setTimeout!");
      }, timeDiffMs);
    }
  } else {
    console.warn("❌ Tidak menjadwalkan notifikasi karena waktu sudah lewat atau terlalu dekat!");
  }

  setSelectedTugas(null);
  setIsVisible(false);
};