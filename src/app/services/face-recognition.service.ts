import { Injectable } from '@angular/core';

declare const faceapi: any;

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private modelsLoaded = false;
  private readonly MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

  constructor() {}

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.MODEL_URL),
        faceapi.nets.ssdMobilenetv1.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.MODEL_URL)
      ]);
      this.modelsLoaded = true;
      console.log('✅ Face recognition models loaded successfully');
    } catch (error) {
      console.error('❌ Error loading face recognition models:', error);
      throw error;
    }
  }

  async getFaceDescriptor(imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
    if (!this.modelsLoaded) await this.loadModels();

    // Increase inputSize to 320 for better accuracy on mobile, lower threshold to 0.1 for maximum sensitivity
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.1 });
    
    const detection = await faceapi.detectSingleFace(imageElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log('🔍 AI: No face detected in current frame.');
    }
    return detection ? detection.descriptor : null;
  }

  async compareFaces(capturedImage: HTMLVideoElement | HTMLImageElement, profileImageDescriptor: Float32Array): Promise<boolean> {
    const capturedDescriptor = await this.getFaceDescriptor(capturedImage);
    if (!capturedDescriptor) return false;

    const distance = this.computeDistance(capturedDescriptor, profileImageDescriptor);
    // Standard threshold for face-api is around 0.6. Lower means stricter.
    return distance < 0.6;
  }

  computeDistance(descriptor1: Float32Array, descriptor2: Float32Array): number {
    return faceapi.euclideanDistance(descriptor1, descriptor2);
  }

  async createDescriptorFromBase64(base64String: string): Promise<Float32Array | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        if (!this.modelsLoaded) await this.loadModels();
        // Use SSD for profile processing as it's more accurate and only done once
        const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
          .withFaceLandmarks()
          .withFaceDescriptor();
        
        if (detection) {
          console.log('✅ Profile descriptor generated using SSD model');
          resolve(detection.descriptor);
        } else {
          // Fallback to Tiny if SSD fails
          const tinyDescriptor = await this.getFaceDescriptor(img);
          console.log(tinyDescriptor ? '⚠️ Profile descriptor generated using Tiny model' : '❌ Failed to detect face in profile photo');
          resolve(tinyDescriptor);
        }
      };
      img.onerror = () => {
        console.error('❌ Failed to load profile image from base64');
        resolve(null);
      };
      img.src = base64String;
    });
  }
}
