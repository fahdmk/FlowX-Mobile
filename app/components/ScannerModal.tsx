import { StyleSheet, View, Text, Modal, Platform } from "react-native"
import { Button } from "react-native-paper"
import { CameraView } from "expo-camera"

interface ScannerModalProps {
  visible: boolean
  onClose: () => void
  hasPermission: boolean | null
  scanned: boolean
  handleBarcodeScanned: ({ type, data }: { type: string; data: string }) => void
  setScanned: (scanned: boolean) => void
}

const ScannerModal = ({
  visible,
  onClose,
  hasPermission,
  scanned,
  handleBarcodeScanned,
  setScanned,
}: ScannerModalProps) => {
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={styles.scannerContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.webScannerMessage}>
            <Text>Camera is not available on web platform</Text>
            <Button mode="contained" onPress={onClose} style={styles.closeButton}>
              Close
            </Button>
          </View>
        ) : (
          <>
            {hasPermission === true && (
              <CameraView
                style={StyleSheet.absoluteFillObject}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ["qr", "pdf417", "ean13", "ean8", "code128", "code39"],
                }}
              />
            )}
            {hasPermission === false && (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionText}>Camera permission is required to scan</Text>
              </View>
            )}
            <Button
              mode="contained"
              onPress={() => {
                setScanned(false)
                onClose()
              }}
              style={styles.closeScannerButton}
            >
              Cancel
            </Button>
          </>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: "black",
  },
  webScannerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
    padding: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginHorizontal: 20,
  },
  closeButton: {
    marginTop: 20,
  },
  closeScannerButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: 200,
    backgroundColor: "black",
  },
})

export default ScannerModal
