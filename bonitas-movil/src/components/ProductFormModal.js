import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SHADOWS } from '../styles/theme';
import { saveProducto } from '../services/api';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL'];
const CONDICIONES = ['Nuevo', 'Usado'];

export default function ProductFormModal({
  visible,
  onClose,
  onSuccess,
  productoParaEditar,
  apiUrl,
  estadosList = [],
}) {
  const isEdit = !!productoParaEditar;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [talla, setTalla] = useState('M');
  const [marca, setMarca] = useState('');
  const [condicion, setCondicion] = useState('Nuevo');
  const [urlImagen, setUrlImagen] = useState('');
  const [idEstado, setIdEstado] = useState('1');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (productoParaEditar) {
        setNombre(productoParaEditar.nombre || '');
        setDescripcion(productoParaEditar.descripcion || '');
        setPrecio(productoParaEditar.precio ? productoParaEditar.precio.toString() : '');
        setTalla(productoParaEditar.talla || 'M');
        setMarca(productoParaEditar.marca || '');
        setCondicion(productoParaEditar.condicion || 'Nuevo');
        setUrlImagen(productoParaEditar.url_imagen || '');
        setIdEstado(productoParaEditar.id_estado ? productoParaEditar.id_estado.toString() : '1');
      } else {
        setNombre('');
        setDescripcion('');
        setPrecio('');
        setTalla('M');
        setMarca('');
        setCondicion('Nuevo');
        setUrlImagen('');
        setIdEstado('1');
      }
    }
  }, [visible, productoParaEditar]);

  // Selección de archivo descargado o foto en el dispositivo
  const handleSeleccionarArchivoLocal = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permiso Requerido', 'Se requiere acceso a tus imágenes para seleccionar un archivo del dispositivo.');
        return;
      }

      // Usar API actualizada de ImagePicker sin opciones obsoletas
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType ? ImagePicker.MediaType.Images : ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          setUrlImagen(`data:${mimeType};base64,${asset.base64}`);
        } else if (asset.uri) {
          setUrlImagen(asset.uri);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const handleGuardar = async () => {
    if (!nombre.trim() || !precio.trim() || !marca.trim() || !descripcion.trim()) {
      Alert.alert('Campos Obligatorios', 'Por favor completa todos los campos obligatorios: Nombre, Marca, Precio, Imagen y Descripción.');
      return;
    }

    if (isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
      Alert.alert('Precio Inválido', 'Ingresa un precio numérico válido.');
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: parseFloat(precio),
      talla,
      marca: marca.trim(),
      condicion,
      url_imagen: urlImagen.trim() || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500',
      id_estado: parseInt(idEstado, 10),
    };

    setSaving(true);
    try {
      await saveProducto(apiUrl, productoParaEditar?.id_producto, payload);
      Alert.alert(
        '¡Éxito!',
        isEdit ? 'Prenda actualizada con éxito.' : 'Prenda agregada al catálogo.'
      );
      onSuccess();
      onClose();
    } catch (err) {
      Alert.alert('Error al guardar', err.message || 'No se pudo guardar la prenda.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, SHADOWS.modal]}>
          
          {/* Header del Formulario Web */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Editar Prenda' : 'Agregar Nueva Prenda'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.btnClose}>
              <Ionicons name="close" size={24} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            
            {/* Nombre y Marca */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre de la Prenda *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Vestido Vintage Rojo"
                placeholderTextColor={COLORS.textLight}
                value={nombre}
                onChangeText={setNombre}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Marca *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Zara, Gucci, etc."
                placeholderTextColor={COLORS.textLight}
                value={marca}
                onChangeText={setMarca}
              />
            </View>

            {/* Precio y Talla */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Precio ($) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                  value={precio}
                  onChangeText={setPrecio}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Talla *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {TALLAS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, talla === t && styles.chipActive]}
                      onPress={() => setTalla(t)}
                    >
                      <Text style={[styles.chipText, talla === t && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Condición y Estado de Venta */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Condición *</Text>
                <View style={styles.rowFields}>
                  {CONDICIONES.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chipFlex, condicion === c && styles.chipFlexActive]}
                      onPress={() => setCondicion(c)}
                    >
                      <Text style={[styles.chipText, condicion === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Estado de Venta *</Text>
                <View style={styles.rowFields}>
                  <TouchableOpacity
                    style={[styles.statusOption, idEstado === '1' && { backgroundColor: COLORS.disponibleBg, borderColor: COLORS.disponible }]}
                    onPress={() => setIdEstado('1')}
                  >
                    <Text style={[styles.statusOptionText, idEstado === '1' && { color: COLORS.disponible, fontWeight: '700' }]}>Disponible</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusOption, idEstado === '2' && { backgroundColor: COLORS.apartadoBg, borderColor: COLORS.apartado }]}
                    onPress={() => setIdEstado('2')}
                  >
                    <Text style={[styles.statusOptionText, idEstado === '2' && { color: COLORS.apartado, fontWeight: '700' }]}>Apartado</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statusOption, idEstado === '3' && { backgroundColor: COLORS.vendidoBg, borderColor: COLORS.vendido }]}
                    onPress={() => setIdEstado('3')}
                  >
                    <Text style={[styles.statusOptionText, idEstado === '3' && { color: COLORS.vendido, fontWeight: '700' }]}>Vendido</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Imagen de la Prenda (Archivo local o URL) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Imagen de la Prenda *</Text>
              
              <TouchableOpacity style={styles.btnFilePicker} onPress={handleSeleccionarArchivoLocal}>
                <Ionicons name="folder-open-outline" size={18} color={COLORS.primary} />
                <Text style={styles.btnFilePickerText}>Seleccionar archivo descargado de tu dispositivo</Text>
              </TouchableOpacity>

              <Text style={styles.urlOrText}>o URL:</Text>
              <TextInput
                style={styles.input}
                placeholder="https://enlace.com/imagen.jpg"
                placeholderTextColor={COLORS.textLight}
                value={urlImagen}
                onChangeText={setUrlImagen}
                autoCapitalize="none"
              />

              {urlImagen ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: urlImagen }} style={styles.previewImage} resizeMode="contain" />
                  <Text style={styles.previewText}>Previsualización</Text>
                </View>
              ) : null}
            </View>

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, { height: 75, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Detalles sobre textil, corte, etc."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
                value={descripcion}
                onChangeText={setDescripcion}
              />
            </View>

          </ScrollView>

          {/* Botones de Acción Formulario Web */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={saving}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnSave, saving && { opacity: 0.7 }]} onPress={handleGuardar} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.btnSaveText}>{isEdit ? 'Guardar Cambios' : 'Registrar Prenda'}</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(56, 42, 75, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  btnClose: {
    padding: 6,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.grayBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.textMain,
  },
  rowFields: {
    flexDirection: 'row',
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.grayBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipFlex: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.grayBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 2,
  },
  chipFlexActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 2,
    backgroundColor: COLORS.grayBackground,
  },
  statusOptionText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  btnFilePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  btnFilePickerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
    flex: 1,
  },
  urlOrText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  previewContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.grayBackground,
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  previewText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.grayBackground,
    marginRight: 8,
  },
  btnCancelText: {
    color: COLORS.secondary,
    fontWeight: '700',
    fontSize: 14,
  },
  btnSave: {
    flex: 2,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  btnSaveText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
