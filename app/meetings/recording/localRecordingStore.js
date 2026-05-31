const DB_NAME = "virtus_meeting_recordings";
const DB_VERSION = 1;
const STORE_NAME = "recordings";

function openRecordingDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available in this browser."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open recording database."));
  });
}

export async function saveMeetingRecording(recording) {
  const database = await openRecordingDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.put(recording);

    transaction.oncomplete = () => {
      database.close();
      resolve(recording.id);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not save meeting recording."));
    };
  });
}

export async function getMeetingRecording(recordingId) {
  const database = await openRecordingDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(recordingId);

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      database.close();
      reject(request.error || new Error("Could not load meeting recording."));
    };
  });
}

export async function listMeetingRecordings() {
  const database = await openRecordingDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      database.close();
      const recordings = Array.isArray(request.result) ? request.result : [];

      resolve(
        recordings
          .map((recording) => ({
            id: recording.id,
            title: recording.title,
            roomId: recording.roomId,
            createdAt: recording.createdAt,
            durationSeconds: recording.durationSeconds,
          }))
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      );
    };

    request.onerror = () => {
      database.close();
      reject(request.error || new Error("Could not list meeting recordings."));
    };
  });
}

export async function deleteMeetingRecording(recordingId) {
  const database = await openRecordingDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    store.delete(recordingId);

    transaction.oncomplete = () => {
      database.close();
      resolve(true);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error || new Error("Could not delete meeting recording."));
    };
  });
}
