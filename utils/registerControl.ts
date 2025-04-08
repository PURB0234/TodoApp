import { db } from "@/service/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { Alert } from "react-native";
import { router } from "expo-router";

export const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const registerControl = async (email: string, password: string, confirmPassword: string) => {
    if (!email.trim() && !password.trim() && !confirmPassword.trim()) {
        Alert.alert('Input Error', 'Harap isi semua kolom.');
        return;
    } else if (!email.trim() && !password.trim()) {
        Alert.alert('Input Error', 'Harap isi email dan password.');
        return;
    } else if (!password.trim() && !confirmPassword.trim()) {
        Alert.alert('Input Error', 'Harap isi password dan konfirmasi password.');
        return;
    } else if (!confirmPassword.trim()) {
        Alert.alert('Input Error', 'Harap isi konfirmasi password.');
        return;
    } else if (!password.trim() || !confirmPassword.trim()) {
        Alert.alert('Input Error', 'Harap isi password.');
        return;
    } else if (!email.trim() && !password.trim() && !confirmPassword.trim()) { 
        Alert.alert('Input Error', 'Harap isi email dan konfirmasi password.');
        return;
    }

    if (!validateEmail(email)) {
        Alert.alert('Invalid Email', 'Harap masukkan alamat email yang valid.');
        return;
    }

    if (password !== confirmPassword) {
        Alert.alert('Password tidak cocok', 'Password dan konfirmasi password tidak sama.');
        return;
    }

    try {
        const userQuery = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
            Alert.alert('Error', 'Email sudah terdaftar.');
            return;
        }

        await addDoc(collection(db, 'users'), {email, password, timestamp: new Date() });
        Alert.alert('Success', 'Registrasi berhasil! Silakan login.');
        router.push('/(tabs)/Login');
    } catch (error) {
        console.error('Error adding document: ', error);
        Alert.alert('Error', 'Failed to register.');
    }
};