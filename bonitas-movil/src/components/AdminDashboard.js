import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../styles/theme';
import {
  fetchProductosAdmin,
  fetchApartadosAdmin,
  fetchVentasAdmin,
  fetchEstados,
  deleteProducto,
  completarApartado,
  cancelarApartado,
} from '../services/api';
import ProductFormModal from './ProductFormModal';

export default function AdminDashboard({ user, onLogout, apiUrl }) {
  const [activeTab, setActiveTab] = useState('prendas'); // 'prendas' | 'apartados' | 'ventas'

  // Datos
  const [productos, setProductos] = useState([]);
  const [apartados, setApartados] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [estados, setEstados] = useState([]);

  // Estados de Carga
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [prodsData, apartsData, ventasData, estsData] = await Promise.allSettled([
        fetchProductosAdmin(apiUrl),
        fetchApartadosAdmin(apiUrl),
        fetchVentasAdmin(apiUrl),
        fetchEstados(apiUrl),
      ]);

      if (prodsData.status === 'fulfilled') setProductos(prodsData.value);
      if (apartsData.status === 'fulfilled') setApartados(apartsData.value);
      if (ventasData.status === 'fulfilled') setVentas(ventasData.value);
      if (estsData.status === 'fulfilled') setEstados(estsData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Acciones
  const handleEditar = (prod) => {
    setProductoEditar(prod);
    setShowModal(true);
  };

  const handleEliminar = (idProducto) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que deseas eliminar esta prenda del catálogo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProducto(apiUrl, idProducto);
              Alert.alert('¡Éxito!', 'Prenda eliminada con éxito.');
              cargarDatos();
            } catch (err) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la prenda.');
            }
          },
        },
      ]
    );
  };

  const handleCompletarCompra = (idApartado) => {
    Alert.alert(
      'Completar Compra',
      '¿Estás seguro de que deseas marcar este apartado como COMPLETADO y concretar la compra? La prenda pasará a estar Vendida y se registrará formalmente la transacción.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Completar Compra',
          onPress: async () => {
            try {
              await completarApartado(apiUrl, idApartado);
              Alert.alert('¡Éxito!', '¡Compra completada con éxito! Registrada en la tabla de venta.');
              cargarDatos();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleQuitarApartado = (idApartado, idProducto) => {
    Alert.alert(
      'Quitar Apartado',
      '¿Estás seguro de que deseas cancelar y eliminar este apartado? La prenda volverá a estar disponible de inmediato en la tienda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelarApartado(apiUrl, idApartado, idProducto);
              Alert.alert('¡Éxito!', 'Apartado eliminado y prenda liberada con éxito.');
              cargarDatos();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  // Render Prenda (Igual a la tabla web de la sección 1)
  const renderProductoCard = ({ item }) => {
    const estadoNombre = item.estado_nombre || item.nombre_estado || (item.id_estado === 1 ? 'Disponible' : item.id_estado === 2 ? 'Apartado' : 'Vendido');

    return (
      <View style={[styles.cardItem, SHADOWS.card]}>
        <Image
          source={{
            uri: item.url_imagen || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=80',
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.itemName}>{item.nombre}</Text>
            <View style={styles.badgeState}>
              <Text style={styles.badgeStateText}>{estadoNombre}</Text>
            </View>
          </View>

          <Text style={styles.itemMeta}>
            ID: #{item.id_producto} • Marca: {item.marca || '-'} • Talla: {item.talla}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>${parseFloat(item.precio).toFixed(2)}</Text>
            <Text style={styles.itemCondicion}>{item.condicion}</Text>
          </View>

          <View style={styles.tableActions}>
            <TouchableOpacity style={styles.btnEdit} onPress={() => handleEditar(item)}>
              <Text style={styles.btnEditText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnDelete} onPress={() => handleEliminar(item.id_producto)}>
              <Text style={styles.btnDeleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render Apartado (Igual a la sección 2 de la web)
  const renderApartadoCard = ({ item }) => {
    const reg = item.fecha_apartado ? new Date(item.fecha_apartado).toLocaleDateString('es-MX') : '-';
    const lim = item.fecha_limite ? new Date(item.fecha_limite).toLocaleDateString('es-MX') : '-';

    return (
      <View style={[styles.cardItem, SHADOWS.card]}>
        <View style={styles.cardContentFull}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.itemName}>Apartado #{item.id_apartado}</Text>
            <View style={styles.badgeStateActive}>
              <Text style={styles.badgeStateActiveText}>{item.estatus || 'Activo'}</Text>
            </View>
          </View>

          <Text style={styles.itemMeta}>
            Cliente: <Text style={{ fontWeight: '700', color: COLORS.secondary }}>{item.usuario_nombre || item.nombre_cliente}</Text>
          </Text>
          <Text style={styles.itemMeta}>Correo: {item.correo || item.correo_cliente}</Text>
          <Text style={styles.itemMeta}>Teléfono: {item.telefono || 'N/A'}</Text>

          <View style={styles.divider} />

          <Text style={styles.itemPrendaTitle}>Prenda: {item.producto_nombre || item.nombre_producto}</Text>
          <Text style={styles.itemMeta}>Talla: {item.talla}</Text>
          <Text style={styles.itemPrice}>Monto: ${parseFloat(item.precio || 0).toFixed(2)}</Text>

          <Text style={styles.itemDates}>Registro: {reg} | Límite: {lim}</Text>

          <View style={styles.tableActions}>
            {item.estatus === 'Activo' && (
              <TouchableOpacity style={styles.btnEdit} onPress={() => handleCompletarCompra(item.id_apartado)}>
                <Text style={styles.btnEditText}>Completar Compra</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.btnDelete} onPress={() => handleQuitarApartado(item.id_apartado, item.id_producto)}>
              <Text style={styles.btnDeleteText}>Quitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render Venta (Igual a la sección 3 de la web)
  const renderVentaCard = ({ item }) => {
    const fecha = item.fecha_venta
      ? new Date(item.fecha_venta).toLocaleDateString('es-MX', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        })
      : 'Recientemente';

    return (
      <View style={[styles.cardItem, SHADOWS.card]}>
        <View style={styles.cardContentFull}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.itemName}>Venta #{item.id_venta}</Text>
            <Text style={styles.totalCobrado}>${parseFloat(item.total_final || item.precio || 0).toFixed(2)}</Text>
          </View>

          <Text style={styles.itemMeta}>
            Cliente: <Text style={{ fontWeight: '700', color: COLORS.secondary }}>{item.usuario_nombre || item.nombre_cliente}</Text>
          </Text>
          <Text style={styles.itemMeta}>Contacto: {item.correo}</Text>
          <Text style={styles.itemMeta}>Método Pago: {item.metodo_pago_nombre || 'Efectivo/Digital'}</Text>
          <Text style={styles.itemMeta}>Tipo Entrega: {item.tipo_entrega_nombre || 'En Tienda'}</Text>
          <Text style={styles.itemDates}>Fecha: {fecha}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      {/* Cabecera Principal con Logo Oficial */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.headerLogo}
            resizeMode="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.dashboardTitle}>Panel de Vendedor</Text>
            <Text style={styles.dashboardSubtitle}>
              Administración de inventario, catálogo y control de apartados de clientes.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnLogout} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
          <Text style={styles.btnLogoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* Botones de Pestañas (Igual a la web) */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'prendas' && styles.tabBtnActive]}
          onPress={() => setActiveTab('prendas')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'prendas' && styles.tabBtnTextActive]}>
            Prendas e Inventario
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'apartados' && styles.tabBtnActive]}
          onPress={() => setActiveTab('apartados')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'apartados' && styles.tabBtnTextActive]}>
            Apartados y Reservaciones
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ventas' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ventas')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'ventas' && styles.tabBtnTextActive]}>
            Historial de Ventas
          </Text>
        </TouchableOpacity>
      </View>

      {/* SECCIÓN 1: PRENDAS */}
      {activeTab === 'prendas' && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Catálogo e Inventario de Prendas</Text>
            <TouchableOpacity
              style={styles.btnAddProduct}
              onPress={() => {
                setProductoEditar(null);
                setShowModal(true);
              }}
            >
              <Text style={styles.btnAddProductText}>+ Agregar Nueva Prenda</Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando inventario...</Text>
            </View>
          ) : (
            <FlatList
              data={productos}
              keyExtractor={(item) => item.id_producto.toString()}
              renderItem={renderProductoCard}
              contentContainerStyle={styles.listPadding}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No tienes prendas en inventario en este momento. ¡Agrega tu primer prenda!
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* SECCIÓN 2: APARTADOS */}
      {activeTab === 'apartados' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionSubtitleHeader}>Monitoreo de Apartados de Clientes</Text>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando apartados...</Text>
            </View>
          ) : (
            <FlatList
              data={apartados}
              keyExtractor={(item, index) => (item.id_apartado ? item.id_apartado.toString() : index.toString())}
              renderItem={renderApartadoCard}
              contentContainerStyle={styles.listPadding}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No hay apartados o reservaciones registradas por el momento.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* SECCIÓN 3: HISTORIAL DE VENTAS */}
      {activeTab === 'ventas' && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionSubtitleHeader}>Historial de Ventas Concretadas</Text>

          {loading && !refreshing ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Cargando ventas...</Text>
            </View>
          ) : (
            <FlatList
              data={ventas}
              keyExtractor={(item, index) => (item.id_venta ? item.id_venta.toString() : index.toString())}
              renderItem={renderVentaCard}
              contentContainerStyle={styles.listPadding}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
              ListEmptyComponent={
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No hay ventas registradas por el momento.
                  </Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {/* Modal de Producto */}
      <ProductFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={cargarDatos}
        productoParaEditar={productoEditar}
        apiUrl={apiUrl}
        estadosList={estados}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.secondary,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 50,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    marginRight: 10,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.white,
  },
  dashboardSubtitle: {
    fontSize: 11,
    color: COLORS.border,
    marginTop: 2,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  btnLogoutText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    flex: 1,
  },
  sectionSubtitleHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btnAddProduct: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAddProductText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  cardItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: 70,
    height: 85,
    borderRadius: 8,
    backgroundColor: COLORS.grayBackground,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  cardContentFull: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    flex: 1,
  },
  badgeState: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeStateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeStateActive: {
    backgroundColor: COLORS.apartadoBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeStateActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.apartado,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalCobrado: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemCondicion: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  itemPrendaTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 4,
  },
  itemDates: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  tableActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnEdit: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  btnEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btnDelete: {
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
