import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type User
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'
import { deleteObject, getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const storage = getStorage(app)
export const db = getFirestore(app, 'bafkitchen-db')

// Add connection timeout and better error handling
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Add some debugging for development
  console.log('Firebase initialized with config:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  })
}

export const handleGoogleLogin = async ({
  onError,
  onSuccess
}: {
  // eslint-disable-next-line no-unused-vars
  onError: (error: string | null) => void
  // eslint-disable-next-line no-unused-vars
  onSuccess: (user: User) => void
}) => {
  try {
    const provider = new GoogleAuthProvider()
    const { user } = await signInWithPopup(auth, provider)
    onSuccess(user)
  } catch (error) {
    onError((error as Error).message)
  }
}

export const handleLogout = ({ onLogout }: { onLogout: () => void }) => {
  signOut(auth)
    .then(() => {
      // Sign-out successful
      console.log('User logged out successfully')
      onLogout()
    })
    .catch((error) => {
      // An error happened
      console.error('Error logging out:', error)
    })
}

export const handleEmailPasswordAuth = async ({
  isSignUp,
  email,
  password
}: {
  isSignUp: boolean
  email: string
  password: string
}) => {
  try {
    let userCredential
    if (isSignUp) {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      console.log('User signed up:', userCredential.user)
    } else {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('User signed in:', userCredential.user)
    }
    return userCredential.user
  } catch (error) {
    console.error(
      `Error ${isSignUp ? 'signing up' : 'signing in'} with email/password`,
      error
    )
    return error
  }
}

export async function saveUserToFirestore(
  role: 'customer' | 'admin',
  user: UserArgs,
  options?: {
    // eslint-disable-next-line no-unused-vars
    onError?: (error: Error | string) => void
    // eslint-disable-next-line no-unused-vars
    onSuccess?: (user: UserArgs) => void
  }
) {
  try {
    const userRef = doc(db, 'users', user.uid)

    const docSnapshot = await getDoc(userRef)

    // Prepare the user data object
    const userData = {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
      photoUrl: user.photoURL || null,
      phoneNumber: user.phoneNumber || null,
      role: role
    }

    if (docSnapshot.exists()) {
      options?.onSuccess?.(docSnapshot.data() as UserArgs)
      console.log('User data existed')
      return
    }

    // Save the user data to Firestore
    await setDoc(userRef, userData, { merge: false })
    console.log('User data saved successfully to Firestore')
    options?.onSuccess?.(user)
  } catch (error) {
    console.error('Error saving user data to Firestore:', error)
    options?.onError?.(error as Error)
  }
}

interface IFirebaseUploadResponse {
  downloadURL: string
  fullPath: string
}

export const uploadToFirebase = async (
  image: File
): Promise<IFirebaseUploadResponse> => {
  // Check authentication status
  const currentUser = auth.currentUser;
  console.log('Current user during upload:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'Not authenticated');
  
  if (!currentUser) {
    throw new Error('User not authenticated. Please log in again.');
  }

  // Check user role before attempting upload
  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      console.warn('User profile not found in Firestore, but allowing upload for admin panel access');
      // For admin panel usage, allow upload if user is authenticated
      // You may want to create the user profile here or handle it differently
    } else {
      const userData = userDoc.data();
      console.log('User role found:', userData.role);

      // Allow admin and user roles to upload (since this is admin panel)
      if (userData.role !== 'admin' && userData.role !== 'user') {
        throw new Error(`Access denied. Current role: ${userData.role}. Only administrators and users can upload images.`);
      }
    }

    console.log('User permissions verified for upload');
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to verify user permissions.');
  }

  const uniqueImageName = `${image.name}_${crypto.randomUUID()}`
  const imageRef = ref(storage, `images/${uniqueImageName}`)

  try {
    // Upload the file
    const uploadResult = await uploadBytes(imageRef, image)

    // Get the download URL
    const downloadURL = await getDownloadURL(uploadResult.ref)
    
    return {
      downloadURL,
      fullPath: uploadResult.ref.fullPath
    }
  } catch (error) {
    console.error('Firebase Storage upload error:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'storage/unauthorized') {
      throw new Error('Upload failed: You do not have permission to upload images. Please ensure you are logged in as an administrator.');
    }
    throw error;
  }
}

export const removeImageFromFirebase = async (imageUrl: string) => {
  try {
    // Extract the file path from the URL
    const pathSegment = imageUrl.split('/o/')[1].split('?')[0];
    const filePath = decodeURIComponent(pathSegment);

    // Delete the file from Firebase Storage
    const imageRef = ref(storage, filePath);
    await deleteObject(imageRef);
    console.log('File deleted successfully from Firebase Storage');

  } catch (error) {
    console.error('Error removing image from Firebase:', error);
  }
};
type UserArgs = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  phoneNumber: string | null
}
