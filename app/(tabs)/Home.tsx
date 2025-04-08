import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  ToastAndroid,
} from 'react-native';
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from '@/style/home_style';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { db } from '@/service/firebaseConfig'
import TugasComponent from '@/components/Tugas';
import { handleHapusDeadline, handleSimpanDeadline } from '@/utils/deadlineCrontrol';
import { requestNotificationPermission, setupNotificationListener } from '@/utils/notifikasi';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { Appbar } from "react-native-paper"

type Tugas = {
  [x: string]: unknown;
  id: string;
  judulTugas: string;
  subTugas: any[];
  prioritas: boolean;
  createdAt: string;
  deadline: string | null | undefined;
};

const Home: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [tugas, setTugas] = useState<Tugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTugas, setSelectedTugas] = useState<Tugas | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [profil, setProfile] = useState(false);
  const [aktif, setAktif] = useState(false);
  const [selectedEdit, setSelectedEdit] = useState<Tugas | null>(null);
  const [editJudulTugas, setEditJudulTugas] = useState<string>('');
  const [subTugas, setSubTugas] = useState<string>('')
  const [subTugasList, setSubTugasList] = useState<SubTugas[]>([]);
  const [isSelesai, setIsSelesai] = useState(true);
  const [selectedSwitch, setSelectedSwitch] = useState(false)
  const [userId, setUserId] = useState<string | null>(null);
  // const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filterTugas, setFilterTugas] = useState<Tugas[]>([]);
  const [tanggal, setTanggal] = useState(new Date());
  const [waktu, setWaktu] = useState(new Date());
  const [newSubTugasList, setNewSubTugasList] = useState<{
    statusSelesai: any; text: string
  }[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    requestNotificationPermission();
    setupNotificationListener();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const getEmail = async () => {
        const email = await AsyncStorage.getItem("userEmail");
        setUserEmail(email);
      };
      getEmail();
    }, [])
  );

  useEffect(() => {
    if (!modalVisible) {
      console.log('Reset sub-tugas setelah modal di close');
      setNewSubTugasList([]);
      setSelectedEdit(null);
      setSubTugas('');
    }
  }, [modalVisible]);

  interface TugasData {
    subTugas: SubTugas[];
  }

  //Function/Method
  const handleTambahSubTugas = async () => {
    if (!subTugas.trim()) return Alert.alert('Error', 'Sub-Tugas tidak boleh kosong!');
    if (!selectedTugas) return Alert.alert('Error', 'Tugas tidak dipilih!');
    const newSubTugas = {
      text: subTugas,
      statusSelesai: false
    };
    setNewSubTugasList([...newSubTugasList, newSubTugas]);

    try {
      const tugasDocRef = doc(db, 'tdl', selectedTugas.id);
      const docSnap = await getDoc(tugasDocRef);
      if (docSnap.exists()) {
        const existingSubTugas = docSnap.data().subTugas;
        const newSubTugas = [...existingSubTugas, { text: subTugas }];
        await updateDoc(tugasDocRef, {
          subTugas: newSubTugas
        });
        setSubTugasList(newSubTugas);
        setSubTugas('');
        // Alert.alert('Sukses', 'Sub-Tugas berhasil ditambahkan!');
      } else {
        Alert.alert('Error', 'Dokumen tidak ditemukan!');
      }
    } catch (e) {
      console.error('Error add document: ', e);
      Alert.alert('Error', 'Gagal menambahkan Sub-Tugas baru!');
    }
  };

  const fetchTugas = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        // Alert.alert('Error', 'User not logged in.');
        return;
      }

      const taskQuery = query(collection(db, 'tdl'), where('userId', '==', userId));
      const querySnapshot = await getDocs(taskQuery);

      const userTasks: Tugas[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userTasks.push({
          id: doc.id,
          judulTugas: data.judulTugas || '',
          subTugas: data.subTugas || [],
          prioritas: data.prioritas,
          createdAt: data.createdAt || '',
          deadline: data.deadline || '',
        });
      });

      setTugas(userTasks);
    } catch (error) {
      console.error('Terjadi kesalahan saat mengambil tugas.', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    const filterTugas = tugas.filter((item) => {
      const judulTugas = item.judulTugas.toLowerCase();
      const subTugas = item.subTugas.map((sub) =>
        sub.text.toLowerCase());
      const searchText = text.toLowerCase();

      return (
        judulTugas.includes(searchText) ||
        subTugas.some((sub) => sub.includes(searchText))
      );
    });
    setFilterTugas(filterTugas);
  };

  useEffect(() => {
    fetchTugas();

    const intervalId = setInterval(() => {
      fetchTugas();
    }, 500);

    return () => clearInterval(intervalId);
  }, [fetchTugas]);

  const deleteTugas = async (id: string) => {
    try {
      const tugasDocRef = doc(db, 'tdl', id);
      await deleteDoc(tugasDocRef);
      setModalVisible(false);
      setTugas((prevTugas) => prevTugas.filter((tugas) => tugas.id !== id));
      ToastAndroid.show('Tugas berhasil dihapus.', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error deleting tugas:', error);
      alert('Gagal menghapus tugas!');
    }
  };

  // const toggleComplete = (index: number): void => {
  //   const updatedList = [...subTugasList];
  //   updatedList[index].statusSelesai = !updatedList[index].statusSelesai;
  //   setSubTugasList(updatedList);
  // }

  const handleOpenModal = (item: Tugas) => {
    setSelectedTugas(item);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedTugas(null);
  };

  const handleOpenEditTugas = (item: Tugas) => {
    setSelectedEdit(item);
    setModalVisible(true);
  };

  const handleCloseEditTugas = () => {
    setModalVisible(false);
    setSelectedEdit(null);

    setNewSubTugasList([]);
    setSubTugas('');
  }

  const handleOpenDeadline = () => {
    setSelectedDeadline(true);
    setIsVisible(true);
  }

  const handleCloseDeadline = () => {
    setSelectedDeadline(false);
    setIsVisible(false);
  }

  const handleToggleSubTask = async (subTask: any, index: number) => {
    if (!selectedTugas) return;

    const updatedSubTugas = [...selectedTugas.subTugas];
    const subTugasIndex = updatedSubTugas.findIndex((item) => item.text === subTask.text);
    updatedSubTugas[subTugasIndex] = {
      ...updatedSubTugas[subTugasIndex],
      completed: !updatedSubTugas[subTugasIndex].completed
    };
    setSelectedTugas({ ...selectedTugas, subTugas: updatedSubTugas });
    setIsSelesai(updatedSubTugas.some((item) => item.completed));

    try {
      const tugasDocRef = doc(db, 'tdl', selectedTugas.id);
      await updateDoc(tugasDocRef, {
        subTugas: updatedSubTugas,
      });
      setSelectedTugas((prevTugas) => ({
        ...prevTugas!,
        subTugas: updatedSubTugas,
      }));
    } catch (error) {
      console.error('Error updating sub-task status:', error);
    }
  };

  useEffect(() => {
    fetchTugas();
  }, []);

  interface SubTugas {
    text: string;
    statusSelesai: boolean;
  }

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        console.log('Cek user ID di home:', storedUserId);
        if (storedUserId) {
          setIsLoggedIn(true);
          setIsCheckingLogin(false);
        } else {
          setIsLoggedIn(false);
          router.replace('/(tabs)/Login')
        }
      } catch (error) {
        console.log('Error cek login status:', error);
        setIsLoggedIn(false);
        router.replace('/(tabs)/Login')
      }
    };
    checkLoginStatus();
  }, [router])

  const Logout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userId');
              await AsyncStorage.removeItem('userEmail');
              setUserEmail(null);
              setIsLoggedIn(false);
              setSelectedSwitch(false);
              // Alert.alert('Berhasil', 'Anda berhasil keluar!');
              ToastAndroid.show('Anda telah keluar.', ToastAndroid.SHORT);
              setTimeout(() => {
                router.replace('/(tabs)/Login')
              }, 500);
            } catch (error) {
              console.error('Error saat logout:', error);
              Alert.alert('Error', 'Gagal logout. Coba lagi.');
            };
          },
        },
      ],
    );
  };

  const handleOpenSwitchAkun = () => {
    console.log('Klik Switch');
    setProfile(true)
    setSelectedSwitch(true)
  }

  const handleCloseSwitchAkun = () => {
    setProfile(false)
    setSelectedSwitch(false)
  }

  if (isCheckingLogin) {
    return (
      <View style={styles.container}>
        <Text>Memeriksa status login...</Text>
      </View>
    );
  };

  const handleHapusSubTugas = async (index: number) => {
    const newSubTugasListFilter = newSubTugasList.filter((item, idx) => idx !== index);
    setNewSubTugasList(newSubTugasListFilter);
    try {
      if (selectedTugas?.id) {
        const tugasDocRef = doc(db, 'tdl', selectedTugas.id);
        const docSnap = await getDoc(tugasDocRef);
        if (docSnap.exists()) {
          const existingSubTugas = docSnap.data().subTugas as { statusSelesai: boolean; text: string }[];
          const itemToDelete = newSubTugasList[index];
          const newSubTugas = existingSubTugas.filter((item) => item.text !== itemToDelete.text);
          await updateDoc(tugasDocRef, {
            subTugas: newSubTugas,
          });
        }
      }
    } catch (error) {
      console.log('Error hapus sub-tugas: ', error);
    }
  };

  const onChange = (event: any, selectedDate: any) => {
    if (tanggal && event.type === 'set') {
      const newDate = new Date(tanggal);
      newDate.setHours(tanggal.getHours());
      newDate.setMinutes(tanggal.getMinutes());
      setTanggal(newDate);
    }

  };
  const onChange1 = (event: any, selectedDate: any) => {
    if (waktu && event.type === 'set') {
      const newTime = new Date(selectedDate);
      newTime.setHours(waktu.getHours());
      newTime.setMinutes(waktu.getMinutes());
      setWaktu(newTime);
    }
  };

  const handleChangeTanggal = () => {
    if (!selectedTugas) return;
    const now = new Date();
    now.setHours(0, 0, 0, 0)
    DateTimePickerAndroid.open({
      value: tanggal || now,
      onChange: (event, selectedDate) => {
        if (!selectedDate) return;
        selectedDate.setHours(0, 0, 0, 0);
        if (selectedDate >= now) {
          setTanggal(selectedDate);
        } else {
          Alert.alert('Error', 'Silahkan atur dari tanggal sekarang dan seterusnya')
        }
      },
      mode: 'date',
      is24Hour: true,
    });
  };

  const handleChangeWaktu = () => {
    if (!selectedTugas) return;
    DateTimePickerAndroid.open({
      value: waktu,
      onChange: (event, selectedTime) => {
        if (selectedTime) {
          setWaktu(selectedTime);
        }
      },
      mode: 'time',
      is24Hour: true,
    });
  };

  const handlePrioritas = async (item: Tugas) => {
    const updatedTugas = [...tugas];
    const index = updatedTugas.findIndex((t) => t.id === item.id);
    if (index !== -1) {
      updatedTugas[index].prioritas = !updatedTugas[index].prioritas;

      setSelectedTugas(updatedTugas[index]);
    }
    setTugas(updatedTugas);

    try {
      const tugasDocRef = doc(db, 'tdl', item.id);
      await updateDoc(tugasDocRef, { prioritas: updatedTugas[index].prioritas });
    } catch (error) {
      console.error('Error mengubah prioritas:', error);
    }
  };

  const handleHapusSubTugasSatu = async (subTugasText: string) => {
    if (!selectedEdit || !selectedEdit.subTugas) return;

    const updatedSubTugas = selectedEdit.subTugas.filter(sub => sub.text !== subTugasText);

    setSelectedEdit({ ...selectedEdit, subTugas: updatedSubTugas });
    try {
      const tugasDocRef = doc(db, 'tdl', selectedEdit.id);
      await updateDoc(tugasDocRef, { subTugas: updatedSubTugas });
    } catch (error) {
      console.error("Error menghapus sub-tugas:", error);
      Alert.alert("Error", "Gagal menghapus sub-tugas.");
    }
  };

  const handleBatalDeadline = () => {
    setIsVisible(false)
    setSelectedTugas(null);
  };

  //UI/Tampilan
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={'dark-content'} />
      <Appbar style={{ backgroundColor: '#f8f9fa', height: 95 }}>
        {/* <Appbar.Content title="My Todo" /> */}
        <TouchableOpacity style={styles.buttonSwitch} onPress={handleOpenSwitchAkun}>
          <Ionicons name='person-circle' size={30} color={'black'} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Telusuri Catatan Anda"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch(searchText)}>
          <Ionicons name='search' size={20} color={'#00000'} />
        </TouchableOpacity>
      </Appbar>
      <View style={styles.container}>
        {selectedSwitch && (
          <Modal
            animationType='fade'
            visible={profil}
            transparent={true}
            onRequestClose={handleCloseSwitchAkun}
          >
            <View style={styles.v1}>
              <View style={styles.v2}>
                <View style={styles.v3}>
                  <View style={styles.v4}>
                    <Ionicons name='person-circle' size={42} color={'#00000'} />
                    <View style={styles.v5}>
                      <Text style={{ top: 10 }}>{userEmail ? userEmail : 'Tidak ada email'}</Text>
                    </View>
                    <View style={{
                      alignItems: 'flex-start',
                      position: 'absolute',
                      right: 1,
                    }}>
                      <TouchableOpacity style={styles.buttonLogout} onPress={Logout}>
                        <Ionicons name='log-out-outline' size={25} color={'#00000'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.v6}>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {selectedTugas && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={handleCloseModal}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <View style={{
                  flexDirection: 'row',
                  width: '100%',
                  alignItems: 'center',
                }}>
                  <Text style={styles.modalTitle}>{selectedTugas.judulTugas}  </Text>

                  {/* modal pengingat */}
                  {isVisible && (
                    <Modal
                      animationType='slide'
                      visible={isVisible}
                      transparent={true}
                      onRequestClose={handleCloseDeadline}
                    >
                      <View style={styles.modalConatinerTanggal}>
                        <View style={styles.modalContentTanggal}>
                          <View style={{ alignItems: 'center', marginTop: 20 }}>
                            <View style={{
                              width: '100%',
                              height: 30,
                              alignItems: 'center',
                            }}>
                              <Text style={{ fontWeight: 'bold' }}>
                                Tambahkan Pengingat
                              </Text>
                            </View>
                            <View style={{
                              width: '70%',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              height: 'auto',
                              alignItems: 'flex-start',
                              marginStart: 20,
                              marginEnd: 20
                            }}>
                              {Platform.OS !== 'android' ? (
                                <DateTimePicker
                                  value={tanggal}
                                  mode="date"
                                  display="default"
                                  onChange={onChange}
                                />
                              ) : (
                                <TouchableOpacity
                                  onPress={handleChangeTanggal}
                                  style={[styles.buttonTime]}
                                >
                                  <Ionicons name='calendar' size={21} color={'white'} />
                                </TouchableOpacity>
                              )}
                              {Platform.OS !== 'android' ? (
                                <DateTimePicker
                                  value={waktu}
                                  mode="time"
                                  display="default"
                                  onChange={onChange1}
                                />
                              ) : (
                                <TouchableOpacity
                                  onPress={handleChangeWaktu}
                                  style={styles.buttonTime}
                                >
                                  <Ionicons name='time-outline' size={21} color={'white'} />
                                </TouchableOpacity>
                              )}
                            </View>
                            <View style={{ width: '100%', flexDirection: 'column', marginTop: 20 }}>
                              <View style={{
                                width: '100%',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                height: 'auto',
                                alignItems: 'flex-end',
                              }}>
                                <TouchableOpacity style={{
                                  padding: 7
                                }}
                                  onPress={handleBatalDeadline}
                                >
                                  <Text>Batal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{
                                  backgroundColor: 'skyblue',
                                  padding: 7,
                                  borderRadius: 15
                                }}
                                  onPress={() => handleSimpanDeadline(selectedTugas, tanggal, waktu, (tugas) => setSelectedTugas(null), setIsVisible)}
                                >
                                  <Text>Simpan</Text>
                                </TouchableOpacity>
                              </View>
                              <View style={{ justifyContent: 'center', width: '100%', height: 'auto', marginTop: 20 }}>
                                <TouchableOpacity style={{ justifyContent: 'center', alignItems: 'center', padding: 5 }}
                                  onPress={() => handleHapusDeadline(selectedTugas, (tugas) => setSelectedTugas(null), setIsVisible)}
                                >
                                  <Text style={{ color: 'rgb(31, 142, 211)' }}>Hapus</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </Modal>
                  )}
                  <TouchableOpacity onPress={handleOpenDeadline}>
                    <Ionicons name='notifications' size={21} color={'black'} />
                  </TouchableOpacity>

                  {/* prioritas */}
                  <TouchableOpacity style={styles.buttonPriority} onPress={() => handlePrioritas(selectedTugas)}>
                    {selectedTugas.prioritas ? (
                      <Ionicons name="star" size={21} color={'gold'} />
                    ) : (
                      <Ionicons name="star-outline" size={21} color={'black'} />
                    )}
                  </TouchableOpacity>

                  {/* edit tugas/button */}
                  <TouchableOpacity style={styles.buttonEdit} onPress={() => handleOpenEditTugas(selectedTugas)}>
                    <Ionicons name='pencil-sharp' color={'black'} size={21} />
                  </TouchableOpacity>
                </View>
                {selectedTugas?.deadline && (
                  <Text style={{ marginTop: 10, fontSize: 15, fontWeight: '500' }}>
                    Deadline: {new Date(selectedTugas.deadline).toLocaleString()}
                  </Text>
                )}
                <ScrollView>
                  {/* <Text style={styles.modalSubTitle}>Sub-Tugas:</Text> */}

                  {selectedTugas.subTugas && selectedTugas.subTugas.length > 0 ? (
                    selectedTugas.subTugas.filter((sub) => !sub.completed).map((sub, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.subTugasItem}
                        onPress={() =>
                          handleToggleSubTask(sub, index)
                        }
                      >
                        <Ionicons
                          name={sub.completed ? 'checkbox' : 'square-outline'}
                          size={24}
                          color={sub.completed ? 'gray' : 'black'}
                          style={{
                            marginRight: 10,
                          }}
                        />
                        <Text
                          style={[
                            styles.subTugasText,
                            sub.completed && { textDecorationLine: 'line-through', color: 'gray' },
                          ]}
                        >
                          {sub.text || sub}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResultText}>Tidak ada sub-tugas ditemukan.</Text>
                  )}
                </ScrollView>
                <View style={{
                  marginTop: 15
                }}>
                  <TouchableOpacity style={{
                    width: '100%',
                  }} onPress={() => setAktif(!aktif)} >
                    <View style={{
                      flexDirection: 'row'
                    }}>
                      {aktif ? (<Ionicons name='chevron-down' color={'black'} size={25} />) : (
                        <Ionicons name='chevron-up' color={'black'} size={25} />)}
                      <Text style={{
                        marginStart: 15,
                        marginBottom: 20
                      }}>{
                          selectedTugas.subTugas.filter((sub) =>
                            sub.completed).length || '0'
                        }  Selesai</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                {aktif && (
                  <View>
                    {selectedTugas.subTugas.filter((sub) => sub.completed).map((sub, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.subTugasItem}
                        // onPress={() => handleToggleSubTask(sub, index)}
                      >
                        <Ionicons name='checkbox'
                          size={24}
                          color={'gray'}
                          style={{
                            marginRight: 10, marginStart: 37.7
                          }} />
                        <Text style={[styles.subTugasText, { textDecorationLine: 'line-through', color: 'gray' }]}>
                          {sub.text}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.tutupText}>Tutup</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.hapus}
                  onPress={() =>
                    Alert.alert(
                      'Hapus',
                      'Anda yakin mau menghapus tugas ini?',
                      [
                        { text: 'Batal', style: 'cancel' },
                        { text: 'Hapus', onPress: () => deleteTugas(selectedTugas.id) },
                      ]
                    )
                  }
                >
                  <Ionicons name="trash" color="#fff" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        <TugasComponent
          tugas={tugas}
          searchText={searchText}
          filterTugas={filterTugas}
          loading={loading}
          handleOpenModal={handleOpenModal}
        />

        <View style={styles.floatingButtonContainer}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => router.push('/(tabs)/tambah_tugas')}
          >
            <Ionicons name="add" color="#fff" size={30} />
          </TouchableOpacity>
        </View>

        {selectedEdit && (
          <Modal
            visible={modalVisible}
            onRequestClose={handleCloseEditTugas}
            animationType='fade'>
            <View style={{
              marginBottom: 30,
              marginTop: 35,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'flex-end'
            }}>
              <TouchableOpacity style={{
                marginStart: 15
              }}
                onPress={handleCloseEditTugas} >
                <Ionicons name='arrow-back' size={23} color={'#00000'} />
              </TouchableOpacity>
              <Text style={{ fontSize: 20, marginStart: 30 }}>Edit Tugas</Text>
            </View>
            <View>
              <TextInput
                style={{
                  width: '100%',
                  padding: 10,
                  marginBottom: 10,
                  fontSize: 25,
                  marginStart: 15
                }}
                placeholder='Judul Tugas'
                value={editJudulTugas}
                onChangeText={(text) => {
                  setEditJudulTugas(text);
                  if (selectedEdit && text !== selectedEdit.judulTugas) {
                    const tugasDocRef = doc(db, 'tdl', selectedEdit.id);
                    updateDoc(tugasDocRef, { judulTugas: text });
                    setSelectedEdit({ ...selectedEdit, judulTugas: text })
                  };
                }}
              />
            </View>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <View style={styles.listSubTugas1}>
                    {selectedEdit?.subTugas && selectedEdit.subTugas.filter(sub => !sub.completed).map((sub, index) => (
                      <View style={{
                        flexDirection: 'row',
                      }} key={index}>
                        <Text style={{ width: '100%', padding: 10, marginBottom: 10, marginStart: 15, flex: 1 }}>
                          {sub.text}
                        </Text>

                        <TouchableOpacity style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginEnd: 23
                        }} onPress={() => handleHapusSubTugasSatu(sub.text)}>
                          <Ionicons name='trash' color={'red'} size={20} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </GestureHandlerRootView>
            <View style={{
              flexDirection: 'row',
              width: '100%',
              marginBottom: 10,
              justifyContent: 'space-between',
              alignItems: 'center',
              marginStart: 15,
              marginEnd: 15,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  padding: 10
                }}
                placeholder='Sub-Tugas'
                value={subTugas}
                onChangeText={setSubTugas}
              />
              <TouchableOpacity style={{
                marginLeft: 5,
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
                marginEnd: 25
              }} onPress={handleTambahSubTugas}>

                <Ionicons name='add' color={'#00000'} size={23} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={newSubTugasList}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View style={styles.subTugasList}>
                  <Text style={[
                    styles.subTeskText,
                    item.statusSelesai && { textDecorationLine: 'line-through' },
                  ]}>
                    {item.text}
                  </Text>
                  <TouchableOpacity style={{
                    marginEnd: 10,
                  }} onPress={() => handleHapusSubTugas(index)}>
                    <Ionicons name='close-outline' size={24} color={'black'} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </Modal>
        )}
      </View>
    </SafeAreaProvider>
  );
};

export default Home;