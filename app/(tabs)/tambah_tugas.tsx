import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '@/service/firebaseConfig'
import styles from '@/style/addTask_style';
import { handleTambahTugas, handleTambahSubTugas } from '@/utils/addTask';

interface SubTugas {
  text: string;
  completed: boolean;
}

const Tambah: React.FC = () => {
  const [judulTugas, setJudulTugas] = useState<string>('');
  const [subTugas, setSubTugas] = useState<string>('');
  const [subTugasList, setSubTugasList] = useState<SubTugas[]>([]);
  const router = useRouter();

  const handleHapusSubTugas = (index: number) => {
    const updatedList = [...subTugasList];
    updatedList.splice(index, 1);
    setSubTugasList(updatedList);
  };

  return (
    <View style={styles.container}>
      <View style={{
        width: '100%',
        marginBottom: 30,
        marginTop: 35,
        flexDirection: 'row',
        alignItems: 'flex-end'
      }}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/Home')}>
          <Ionicons name='arrow-back' size={23} color={'#00000'} />
        </TouchableOpacity>
        <Text style={{fontSize: 20, marginStart: 30}}>Tambah Tugas</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Judul Tugas"
        value={judulTugas}
        onChangeText={setJudulTugas}
      />

      <View style={styles.subTugasContainer}>
        <TextInput
          style={styles.inputSubTugas}
          placeholder="Sub-Tugas"
          value={subTugas}
          onChangeText={setSubTugas}
        />
        <TouchableOpacity style={styles.addButton} onPress={() => handleTambahSubTugas(subTugas, subTugasList, setSubTugasList, setSubTugas)} >
          <Ionicons name="add" color="#00000" size={23} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={subTugasList}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.subTugasItem}>
            <Text
              style={styles.subTugasText}
            >
              {item.text}
            </Text>
            <TouchableOpacity
              style={{
                marginEnd: 10
              }}
              onPress={() => handleHapusSubTugas(index)}
            >
              <Ionicons name='close-outline' size={24} color={'black'} />
            </TouchableOpacity>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={() => handleTambahTugas(judulTugas, subTugasList, setJudulTugas, setSubTugasList, router)}>
        <Text style={styles.buttonText}>Tambah</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Tambah;
