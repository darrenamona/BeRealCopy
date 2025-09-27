import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/localStorage';

const { width, height } = Dimensions.get('window');

const CameraScreen: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    checkDailyPost();
    startCountdown();
    getCurrentLocation();
  }, []);

  const checkDailyPost = async () => {
    try {
      if (user) {
        const hasPosted = await storageService.hasPostedToday(user.id);
        setHasPostedToday(hasPosted);
      }
    } catch (error) {
      console.error('Error checking daily post:', error);
      setHasPostedToday(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const startCountdown = () => {
    const now = new Date();
    const nextPost = new Date(now);
    nextPost.setHours(24, 0, 0, 0); // Next midnight
    const timeUntilNext = nextPost.getTime() - now.getTime();
    setTimeLeft(Math.floor(timeUntilNext / 1000));
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setHasPostedToday(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePicture = async () => {
    if (!permission?.granted) {
      Alert.alert('Camera Permission Required', 'Please enable camera permission to take photos.');
      return;
    }

    if (isCapturing) return;

    setIsCapturing(true);

    try {
      // Take front photo first
      if (!frontImage) {
        const frontResult = await cameraRef.current?.takePictureAsync({
          quality: 0.8,
        });
        
        if (frontResult?.uri) {
          setFrontImage(frontResult.uri);
          // Switch to back camera
          setFacing('back');
          // Wait a moment then take back photo
          setTimeout(async () => {
            const backResult = await cameraRef.current?.takePictureAsync({
              quality: 0.8,
            });
            
            if (backResult?.uri) {
              setBackImage(backResult.uri);
              // Switch back to front camera
              setFacing('front');
            }
            setIsCapturing(false);
          }, 1000);
        } else {
          setIsCapturing(false);
        }
      } else {
        // If front image exists, take back photo
        const backResult = await cameraRef.current?.takePictureAsync({
          quality: 0.8,
        });
        
        if (backResult?.uri) {
          setBackImage(backResult.uri);
        }
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
      setIsCapturing(false);
    }
  };

  const retakePhotos = () => {
    setFrontImage(null);
    setBackImage(null);
  };

  const postToFeed = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Please take both front and back photos');
      return;
    }

    if (hasPostedToday) {
      Alert.alert('Already Posted', 'You can only post once per day');
      return;
    }

    if (isPosting || !user) {
      return;
    }

    setIsPosting(true);

    try {
      // Convert images to base64
      const frontBase64 = await convertToBase64(frontImage);
      const backBase64 = await convertToBase64(backImage);

      const postData = {
        authorId: user.id,
        author: {
          username: user.username,
          avatar: user.avatar,
        },
        frontImage: frontBase64,
        backImage: backBase64,
        caption: '',
        visibility: 'public' as const,
        location: currentLocation,
        likes: [],
        comments: [],
        shares: [],
      };

      await storageService.createPost(postData);
      
      setHasPostedToday(true);
      setFrontImage(null);
      setBackImage(null);
      
      Alert.alert('Posted!', 'Your BeReal has been posted to the feed');
    } catch (error: any) {
      console.error('Error posting:', error);
      Alert.alert('Error', error.message || 'Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const convertToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Failed to convert image to base64');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (frontImage && backImage) {
    return (
      <View style={styles.container}>
        <View style={styles.previewContainer}>
          <View style={styles.dualPreview}>
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: frontImage }} style={styles.previewImage} />
              <Text style={styles.previewLabel}>Front</Text>
            </View>
            <View style={styles.previewImageContainer}>
              <Image source={{ uri: backImage }} style={styles.previewImage} />
              <Text style={styles.previewLabel}>Back</Text>
            </View>
          </View>
          
          <View style={styles.previewControls}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhotos}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.postButton, isPosting && styles.disabledButton]} 
              onPress={postToFeed}
              disabled={isPosting}
            >
              <Text style={styles.postButtonText}>
                {isPosting ? 'Posting...' : 'Post to Feed'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="picture"
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <Text style={styles.cameraText}>
              {!frontImage ? 'Take a selfie' : 'Take a photo of what you\'re doing'}
            </Text>
            {hasPostedToday && (
              <Text style={styles.timerText}>
                Next post in: {formatTime(timeLeft)}
              </Text>
            )}
          </View>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={[styles.captureButton, isCapturing && styles.disabledButton]} 
              onPress={takePicture}
              disabled={isCapturing}
            >
              <View style={[styles.captureButtonInner, isCapturing && styles.disabledCaptureButton]} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  timerText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dualPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewImageContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: width * 0.4,
    height: height * 0.4,
    borderRadius: 10,
  },
  previewLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 30,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledCaptureButton: {
    backgroundColor: '#666',
  },
});

export default CameraScreen;