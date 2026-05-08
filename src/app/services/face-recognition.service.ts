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

    // Use more sensitive options for detection
    // inputSize 512 is more accurate than 416, and scoreThreshold 0.3 is more inclusive
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });
    
    const detection = await faceapi.detectSingleFace(imageElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection ? detection.descriptor : null;
  }

  async compareFaces(capturedImage: HTMLVideoElement | HTMLImageElement, profileImageDescriptor: Float32Array): Promise<boolean> {
    const capturedDescriptor = await this.getFaceDescriptor(capturedImage);
    if (!capturedDescriptor) return false;

    const distance = faceapi.euclideanDistance(capturedDescriptor, profileImageDescriptor);
    // Standard threshold for face-api is around 0.6. Lower means stricter.
    return distance < 0.6;
  }

  async createDescriptorFromBase64(base64String: string): Promise<Float32Array | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = async () => {
        const descriptor = await this.getFaceDescriptor(img);
        resolve(descriptor);
      };
      img.onerror = () => resolve(null);
      img.src = base64String;
    });
  }
}
