import { Alert } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/service/firebaseConfig';
import { TugasData, SubTugas } from '@/types/typeTugas';
import { ToastAndroid } from 'react-native';

export const handleTambahSubTugas = (
    subTugas: string,
    subTugasList: SubTugas[],
    setSubTugasList: (list: SubTugas[]) => void,
    setSubTugas: (text: string) => void
) => {
    if (!subTugas.trim()) {
        Alert.alert('Error', 'Sub-tugas tidak boleh kosong!');
        return;
    }
    setSubTugasList([...subTugasList, { text: subTugas, completed: false }]);
    setSubTugas('');
};

export const handleTambahTugas = async (
    judulTugas: string,
    subTugasList: SubTugas[],
    setJudulTugas: (text: string) => void,
    setSubTugasList: (list: SubTugas[]) => void,
    router: any
): Promise<void> => {
    if (!judulTugas.trim() && subTugasList.length === 0) {
        Alert.alert('Error', 'Harap isi semua kolom');
        return;
    } else if (!judulTugas.trim()) {
        Alert.alert('Error', 'Harap isi judul tugas');
        return;
    } else if (subTugasList.length === 0) {
        Alert.alert('Error', 'Harap isi sub-tugas');
        return;
    }

    try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) {
            Alert.alert('Error', 'User tidak ditemukan!');
            return;
        }

        const newTugas: TugasData = {
            judulTugas,
            subTugas: subTugasList,
            userId,
            createdAt: new Date(),
        };

        await addDoc(collection(db, 'tdl'), newTugas);
        router.push('/(tabs)/Home');
        // Alert.alert('Sukses', 'Tugas berhasil ditambahkan!');
        ToastAndroid.show('Tugas berhasil ditambahkan', ToastAndroid.SHORT);

        setJudulTugas('');
        setSubTugasList([]);
    } catch (e) {
        console.error('Error adding document: ', e);
        Alert.alert('Error', 'Gagal menambahkan data tugas!');
    }
};
