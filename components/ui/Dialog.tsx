import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react-native";

type DialogType = "success" | "error" | "warning" | "info" | "confirm";

interface DialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type?: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  hideClose?: boolean;
  showFooter?: boolean;
}

export function Dialog({
  visible,
  onClose,
  title,
  description,
  type = "info",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  hideClose = false,
  showFooter = true,
}: DialogProps) {
  const getIcon = () => {
    switch (type) {
      case "success": return <CheckCircle2 size={32} color="#10B981" />;
      case "error": return <AlertCircle size={32} color="#EF4444" />;
      case "warning": return <AlertTriangle size={32} color="#F59E0B" />;
      default: return <Info size={32} color="#3B82F6" />;
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {!hideClose && (
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <View style={styles.iconBox}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          {showFooter && (
            <View style={styles.footer}>
              {type === "confirm" ? (
                <>
                  <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={handleCancel}>
                    <Text style={styles.cancelText}>{cancelLabel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.confirmBtn]}
                    onPress={() => { onConfirm?.(); onClose(); }}
                  >
                    <Text style={styles.confirmText}>{confirmLabel}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={onClose}>
                  <Text style={styles.primaryText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  iconBox: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtn: {
    backgroundColor: "#111827",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  cancelText: {
    color: "#374151",
    fontWeight: "700",
  },
  confirmBtn: {
    backgroundColor: "#111827",
  },
  confirmText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
