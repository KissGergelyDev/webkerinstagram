import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  constructor(private firestore: AngularFirestore) {}

  createDoc(collectionName: string, data: any) {
    return this.firestore.collection(collectionName).add(data);
  }

  getDocs(collectionName: string) {
    return this.firestore.collection(collectionName).valueChanges({ idField: 'id' });
  }
}