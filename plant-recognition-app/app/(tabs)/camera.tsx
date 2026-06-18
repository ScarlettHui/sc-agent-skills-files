import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { recognizePlant } from '../../lib/plantRecognition';
import { savePlant } from '../../lib/plants';
import { BilingualSection, BilingualFacts } from '../../components/BilingualSection';
import type { PlantInfo } from '../../lib/types';

type Step = 'pick' | 'recognizing' | 'review' | 'saving' | 'done';

export default function CameraScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('pick');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [plantInfo, setPlantInfo] = useState<PlantInfo | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  async function pickImage(useCamera: boolean) {
    const { status } = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: false,
          allowsEditing: false,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.5,
          base64: false,
        });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    // Resize large images to stay under Firebase's 10MB request limit
    let uri = asset.uri;
    if ((asset.width ?? 0) > 1200 || (asset.height ?? 0) > 1200) {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      uri = manipulated.uri;
    }

    setImageUri(uri);
    await runRecognition(uri);
  }

  async function runRecognition(uri: string) {
    setStep('recognizing');
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as const,
      });
      const info = await recognizePlant(base64, 'image/jpeg');
      if (!info.isPlant) {
        Alert.alert(
          'Not a plant',
          "We couldn't detect a plant in this photo. Please try a clearer image.",
          [{ text: 'OK', onPress: reset }],
        );
        return;
      }
      setPlantInfo(info);
      setStep('review');
    } catch (err: any) {
      const msg = err.message ?? err.code ?? 'Please try again.';
      Alert.alert('Recognition failed', msg);
      setStep('pick');
    }
  }

  async function handleSave() {
    if (!user || !imageUri || !plantInfo) return;
    setStep('saving');
    try {
      await savePlant(user.uid, imageUri, plantInfo, notes, location);
      setStep('done');
    } catch (err: any) {
      Alert.alert('Save failed', err.message ?? 'Please try again.');
      setStep('review');
    }
  }

  function reset() {
    setStep('pick');
    setImageUri(null);
    setPlantInfo(null);
    setNotes('');
    setLocation('');
  }

  if (step === 'pick') {
    return (
      <View style={styles.pickContainer}>
        <Text style={styles.pickTitle}>Identify a Plant</Text>
        <Text style={styles.pickTitleZh}>识别植物</Text>
        <Text style={styles.pickSubtitle}>
          Take or upload a photo to identify a plant and save it to your collection.
        </Text>

        <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.pickBtnText}>Take Photo</Text>
          <Text style={styles.pickBtnTextZh}>拍照</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pickBtn, styles.pickBtnSecondary]}
          onPress={() => pickImage(false)}
        >
          <Ionicons name="images" size={32} color="#2d6a4f" />
          <Text style={[styles.pickBtnText, styles.pickBtnTextDark]}>Choose from Library</Text>
          <Text style={[styles.pickBtnTextZh, styles.pickBtnTextZhDark]}>从相册选择</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'recognizing') {
    return (
      <View style={styles.loadingContainer}>
        <Image source={{ uri: imageUri! }} style={styles.loadingImage} />
        <ActivityIndicator size="large" color="#2d6a4f" style={{ marginTop: 24 }} />
        <Text style={styles.loadingText}>Identifying plant...</Text>
        <Text style={styles.loadingTextZh}>正在识别植物...</Text>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>✅</Text>
        <Text style={styles.doneTitle}>Saved to Collection!</Text>
        <Text style={styles.doneTitleZh}>已保存到收藏！</Text>
        <Text style={styles.doneName}>{plantInfo?.name.en}</Text>
        <Text style={styles.doneNameZh}>{plantInfo?.name.zh}</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={reset}>
          <Text style={styles.doneBtnText}>Identify Another Plant</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'saving') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Saving to your collection...</Text>
        <Text style={styles.loadingTextZh}>正在保存...</Text>
      </View>
    );
  }

  // review step
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.reviewContainer} contentContainerStyle={{ paddingBottom: 40 }}>
        <Image source={{ uri: imageUri! }} style={styles.reviewImage} />

        <View style={styles.reviewContent}>
          <View style={styles.nameBlock}>
            <Text style={styles.nameEn}>{plantInfo!.name.en}</Text>
            <Text style={styles.nameZh}>{plantInfo!.name.zh}</Text>
            <Text style={styles.scientific}>{plantInfo!.scientificName}</Text>
            <View
              style={[
                styles.confidenceBadge,
                plantInfo!.confidence === 'high'
                  ? styles.confHigh
                  : plantInfo!.confidence === 'medium'
                  ? styles.confMed
                  : styles.confLow,
              ]}
            >
              <Text style={styles.confidenceText}>
                {plantInfo!.confidence === 'high'
                  ? '✓ High confidence'
                  : plantInfo!.confidence === 'medium'
                  ? '~ Medium confidence'
                  : '? Low confidence'}
              </Text>
            </View>
          </View>

          <BilingualSection
            title="Description · 描述"
            en={plantInfo!.description.en}
            zh={plantInfo!.description.zh}
          />
          <BilingualSection
            title="Characteristics · 特征"
            en={plantInfo!.characteristics.en}
            zh={plantInfo!.characteristics.zh}
          />
          <BilingualSection
            title="Habitat · 栖息地"
            en={plantInfo!.habitat.en}
            zh={plantInfo!.habitat.zh}
          />
          <BilingualFacts
            title="Fun Facts · 趣味知识"
            en={plantInfo!.funFacts.en}
            zh={plantInfo!.funFacts.zh}
          />

          <Text style={styles.fieldLabel}>Where did you find it? · 在哪里发现的？</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Central Park, New York"
            placeholderTextColor="#adb5bd"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.fieldLabel}>Notes · 备注</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add your observations..."
            placeholderTextColor="#adb5bd"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="bookmark" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save to Collection · 保存收藏</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.retryBtn} onPress={reset}>
            <Text style={styles.retryBtnText}>Try Another Photo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pickContainer: {
    flex: 1,
    backgroundColor: '#f8faf9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  pickTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1b2b1e',
    textAlign: 'center',
  },
  pickTitleZh: {
    fontSize: 18,
    color: '#52b788',
    textAlign: 'center',
    marginBottom: 12,
  },
  pickSubtitle: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  pickBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  pickBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2d6a4f',
  },
  pickBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  pickBtnTextDark: {
    color: '#2d6a4f',
  },
  pickBtnTextZh: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  pickBtnTextZhDark: {
    color: '#52b788',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8faf9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  loadingImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    fontWeight: '600',
    color: '#2d6a4f',
  },
  loadingTextZh: {
    fontSize: 14,
    color: '#52b788',
    marginTop: 4,
  },
  doneContainer: {
    flex: 1,
    backgroundColor: '#f8faf9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  doneEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b2b1e',
  },
  doneTitleZh: {
    fontSize: 16,
    color: '#52b788',
    marginBottom: 20,
  },
  doneName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d6a4f',
  },
  doneNameZh: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 32,
  },
  doneBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#f8faf9',
  },
  reviewImage: {
    width: '100%',
    height: 280,
  },
  reviewContent: {
    padding: 20,
  },
  nameBlock: {
    marginBottom: 24,
  },
  nameEn: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1b2b1e',
  },
  nameZh: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d6a4f',
    marginTop: 4,
  },
  scientific: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#868e96',
    marginTop: 4,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 10,
  },
  confHigh: { backgroundColor: '#d8f3dc' },
  confMed: { backgroundColor: '#fff3cd' },
  confLow: { backgroundColor: '#f8d7da' },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d6a4f',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#1b2b1e',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  retryBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#868e96',
    fontSize: 15,
  },
});
