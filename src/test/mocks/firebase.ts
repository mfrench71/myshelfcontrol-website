/**
 * Firebase Mock Implementations
 * Mock Firestore, Auth, and Storage for testing
 */
import { vi } from 'vitest';

// Mock Firestore document data
export type MockDocData = Record<string, unknown>;

// Mock Firestore QuerySnapshot
export interface MockQueryDocumentSnapshot {
  id: string;
  data: () => MockDocData;
  exists: () => boolean;
}

export interface MockQuerySnapshot {
  docs: MockQueryDocumentSnapshot[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: MockQueryDocumentSnapshot) => void) => void;
}

// Mock Firestore DocumentSnapshot
export interface MockDocumentSnapshot {
  id: string;
  data: () => MockDocData | undefined;
  exists: () => boolean;
}

// Create mock document snapshot
export function createMockDocSnapshot(
  id: string,
  data: MockDocData | null
): MockDocumentSnapshot {
  return {
    id,
    data: () => (data ? { ...data } : undefined),
    exists: () => data !== null,
  };
}

// Create mock query snapshot
export function createMockQuerySnapshot(
  docs: Array<{ id: string; data: MockDocData }>
): MockQuerySnapshot {
  const mockDocs: MockQueryDocumentSnapshot[] = docs.map((doc) => ({
    id: doc.id,
    data: () => ({ ...doc.data }),
    exists: () => true,
  }));

  return {
    docs: mockDocs,
    empty: mockDocs.length === 0,
    size: mockDocs.length,
    forEach: (callback) => mockDocs.forEach(callback),
  };
}

// Mock Firestore Timestamp
export class MockTimestamp {
  seconds: number;
  nanoseconds: number;

  constructor(seconds: number, nanoseconds = 0) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  toMillis(): number {
    return this.seconds * 1000;
  }

  static now(): MockTimestamp {
    return new MockTimestamp(Math.floor(Date.now() / 1000));
  }

  static fromDate(date: Date): MockTimestamp {
    return new MockTimestamp(Math.floor(date.getTime() / 1000));
  }
}

// Mock Firestore functions
export const mockGetDocs = vi.fn();
export const mockGetDoc = vi.fn();
export const mockAddDoc = vi.fn();
export const mockUpdateDoc = vi.fn();
export const mockDeleteDoc = vi.fn();
export const mockSetDoc = vi.fn();
export const mockCollection = vi.fn();
export const mockDoc = vi.fn();
export const mockQuery = vi.fn();
export const mockWhere = vi.fn();
export const mockOrderBy = vi.fn();
export const mockLimit = vi.fn();

// Mock Auth functions
export const mockSignInWithEmailAndPassword = vi.fn();
export const mockCreateUserWithEmailAndPassword = vi.fn();
export const mockSignOut = vi.fn();
export const mockOnAuthStateChanged = vi.fn();
export const mockUpdatePassword = vi.fn();
export const mockReauthenticateWithCredential = vi.fn();
export const mockEmailAuthProvider = {
  credential: vi.fn(),
};
export const mockSendPasswordResetEmail = vi.fn();
export const mockDeleteUser = vi.fn();

// Mock Storage functions
export const mockUploadBytes = vi.fn();
export const mockGetDownloadURL = vi.fn();
export const mockDeleteObject = vi.fn();
export const mockRef = vi.fn();

// Reset all mocks
export function resetFirebaseMocks(): void {
  mockGetDocs.mockReset();
  mockGetDoc.mockReset();
  mockAddDoc.mockReset();
  mockUpdateDoc.mockReset();
  mockDeleteDoc.mockReset();
  mockSetDoc.mockReset();
  mockCollection.mockReset();
  mockDoc.mockReset();
  mockQuery.mockReset();
  mockWhere.mockReset();
  mockOrderBy.mockReset();
  mockLimit.mockReset();

  mockSignInWithEmailAndPassword.mockReset();
  mockCreateUserWithEmailAndPassword.mockReset();
  mockSignOut.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockUpdatePassword.mockReset();
  mockReauthenticateWithCredential.mockReset();
  mockEmailAuthProvider.credential.mockReset();
  mockSendPasswordResetEmail.mockReset();
  mockDeleteUser.mockReset();

  mockUploadBytes.mockReset();
  mockGetDownloadURL.mockReset();
  mockDeleteObject.mockReset();
  mockRef.mockReset();
}

// Setup Firebase mocks
export function setupFirestoreMocks(): void {
  vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: mockCollection,
    doc: mockDoc,
    getDocs: mockGetDocs,
    getDoc: mockGetDoc,
    addDoc: mockAddDoc,
    updateDoc: mockUpdateDoc,
    deleteDoc: mockDeleteDoc,
    setDoc: mockSetDoc,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    limit: mockLimit,
    Timestamp: MockTimestamp,
    serverTimestamp: () => MockTimestamp.now(),
  }));
}

export function setupAuthMocks(): void {
  vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
    createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
    signOut: mockSignOut,
    onAuthStateChanged: mockOnAuthStateChanged,
    updatePassword: mockUpdatePassword,
    reauthenticateWithCredential: mockReauthenticateWithCredential,
    EmailAuthProvider: mockEmailAuthProvider,
    sendPasswordResetEmail: mockSendPasswordResetEmail,
    deleteUser: mockDeleteUser,
  }));
}

export function setupStorageMocks(): void {
  vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: mockRef,
    uploadBytes: mockUploadBytes,
    getDownloadURL: mockGetDownloadURL,
    deleteObject: mockDeleteObject,
  }));
}

// Mock user for auth tests
export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
    emailVerified: true,
    ...overrides,
  };
}
