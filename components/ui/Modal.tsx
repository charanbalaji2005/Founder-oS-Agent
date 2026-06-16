import React from "react";
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { COLORS } from "@/constants";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.box}>
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  box: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderPrimary,
    padding: 24,
    width: "100%",
    maxWidth: 420,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
});
