import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const newProducts = [
    {
        nombre: 'Vestido de Noche Rojo Carmín',
        descripcion: 'Elegante vestido largo para eventos de gala. Tejido suave, silueta entallada y corte lateral.',
        precio: 1250.00,
        talla: 'M',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80'
    },
    {
        nombre: 'Jeans Slim Fit Denim Oscuro',
        descripcion: 'Pantalón vaquero de mezclilla resistente, corte moderno ajustado semi-elástico.',
        precio: 850.00,
        talla: 'S',
        marca: 'Levis',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80'
    },
    {
        nombre: 'Blusa Primavera Estampada',
        descripcion: 'Blusa de algodón ligera con decorado floral. Perfecta para climas cálidos y uso diario.',
        precio: 450.00,
        talla: 'M',
        marca: 'H&M',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&q=80'
    },
    {
        nombre: 'Chaqueta Biker de Cuero',
        descripcion: 'Chaqueta clásica de cuero sintético con cierres metálicos plateados y forro térmico interno.',
        precio: 1800.00,
        talla: 'L',
        marca: 'Pull&Bear',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80'
    },
    {
        nombre: 'Suéter Tejido de Lana Beige',
        descripcion: 'Suéter de punto grueso y cuello redondo. Muy abrigador, ideal para temporadas frías.',
        precio: 690.00,
        talla: 'M',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=500&q=80'
    },
    {
        nombre: 'Falda Midi Plisada Verde',
        descripcion: 'Falda elegante con pretina elástica y caída fluida. Ideal tanto para outfits formales como casuales.',
        precio: 590.00,
        talla: 'S',
        marca: 'Mango',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&q=80'
    },
    {
        nombre: 'Camisa de Lino Clásica',
        descripcion: 'Camisa formal manga larga confeccionada en lino italiano premium transpirable.',
        precio: 750.00,
        talla: 'L',
        marca: 'Massimo Dutti',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=80'
    },
    {
        nombre: 'Saco Blazer Sastre Negro',
        descripcion: 'Saco formal estructurado con solapa clásica y botones frontales. Excelente corte de sastre.',
        precio: 1450.00,
        talla: 'M',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80'
    },
    {
        nombre: 'Vestido Casual de Algodón',
        descripcion: 'Vestido ligero y fresco tipo polo. Cómodo para uso diario en salidas relajadas.',
        precio: 350.00,
        talla: 'S',
        marca: 'Bershka',
        condicion: 'Usado',
        url_imagen: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=500&q=80'
    },
    {
        nombre: 'Top Corto Encaje Blanco',
        descripcion: 'Crop top ajustado con detalles de encaje y tirantes delgados regulables.',
        precio: 290.00,
        talla: 'XS',
        marca: 'Stradivarius',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80'
    },
    {
        nombre: 'Pantalón Wide Leg Camel',
        descripcion: 'Pantalón de tiro alto y pierna ancha súper cómodo. Tela de vestir de gran calidad.',
        precio: 890.00,
        talla: 'M',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&q=80'
    },
    {
        nombre: 'Sudadera Oversize Capucha',
        descripcion: 'Sudadera holgada con interior de felpa suave, cordón ajustable en gorro y bolsillo frontal.',
        precio: 650.00,
        talla: 'L',
        marca: 'Champion',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80'
    },
    {
        nombre: 'Vestido de Verano en Lino',
        descripcion: 'Vestido holgado midi confeccionado en lino, con tirantes gruesos y bolsillos laterales.',
        precio: 980.00,
        talla: 'M',
        marca: 'H&M',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&q=80'
    },
    {
        nombre: 'Shorts Denim High Waste',
        descripcion: 'Shorts de mezclilla azul con deslavado sutil y dobladillo deshilachado de moda.',
        precio: 280.00,
        talla: 'S',
        marca: 'Levis',
        condicion: 'Usado',
        url_imagen: 'https://images.unsplash.com/photo-1565079080184-61c0e56bd26f?w=500&q=80'
    },
    {
        nombre: 'Cárdigan Tejido Abierto Rosa',
        descripcion: 'Suéter cárdigan suelto de punto abierto en tono rosa pastel. Cómodo y abrigador.',
        precio: 520.00,
        talla: 'M',
        marca: 'Mango',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1574169208507-84376144848b?w=500&q=80'
    },
    {
        nombre: 'Blusa de Satín Esmeralda',
        descripcion: 'Elegante blusa manga larga de tela satinada brillante con cuello camisero clásico.',
        precio: 480.00,
        talla: 'S',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=80'
    },
    {
        nombre: 'Enterizo de Flores Silvestres',
        descripcion: 'Jumpsuit de corte palazzo con estampado de flores. Muy fresco y con caída ligera.',
        precio: 1100.00,
        talla: 'M',
        marca: 'Pull&Bear',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1621184455862-c163dfb30e0f?w=500&q=80'
    },
    {
        nombre: 'Chaleco Acolchado Negro',
        descripcion: 'Chaleco puffer con cierre de cremallera metálica, resistente al agua e interior térmico.',
        precio: 890.00,
        talla: 'L',
        marca: 'Zara',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80'
    },
    {
        nombre: 'Pantalón Cargo Militar',
        descripcion: 'Pantalón cargo de sarga de algodón verde oliva con bolsillos de solapa a los costados.',
        precio: 790.00,
        talla: 'M',
        marca: 'Bershka',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=500&q=80'
    },
    {
        nombre: 'Playera Básica Algodón Orgánico',
        descripcion: 'Playera clásica de cuello redondo en color blanco neutro. Tela suave 100% algodón.',
        precio: 180.00,
        talla: 'S',
        marca: 'H&M',
        condicion: 'Nuevo',
        url_imagen: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80'
    }
];

async function main() {
    const client = await pool.connect();
    try {
        console.log('Iniciando limpieza y repoblación de base de datos...');
        await client.query('BEGIN');

        // 1. Eliminar detalles de ventas
        console.log('Limpiando tabla venta_producto...');
        await client.query('DELETE FROM venta_producto;');

        // 2. Eliminar ventas
        console.log('Limpiando tabla venta...');
        await client.query('DELETE FROM venta;');

        // 3. Eliminar apartados
        console.log('Limpiando tabla apartado...');
        await client.query('DELETE FROM apartado;');

        // 4. Eliminar catálogo de productos
        console.log('Limpiando catálogo de productos...');
        await client.query('DELETE FROM producto;');

        // 5. Eliminar usuarios que no sean administradores (rol != vendedor)
        console.log('Eliminando usuarios que no son administradores...');
        await client.query("DELETE FROM usuario WHERE rol != 'vendedor';");

        // 6. Limpiar métodos de pago no deseados
        console.log('Filtrando métodos de pago...');
        await client.query("DELETE FROM metodo_pago WHERE nombre NOT IN ('Efectivo', 'Transferencia');");
        
        // Verificar que existan los válidos
        const mpEfectivo = await client.query("SELECT * FROM metodo_pago WHERE nombre = 'Efectivo';");
        if (mpEfectivo.rows.length === 0) {
            await client.query("INSERT INTO metodo_pago (nombre) VALUES ('Efectivo');");
        }
        const mpTransf = await client.query("SELECT * FROM metodo_pago WHERE nombre = 'Transferencia';");
        if (mpTransf.rows.length === 0) {
            await client.query("INSERT INTO metodo_pago (nombre) VALUES ('Transferencia');");
        }

        // 7. Limpiar tipos de entrega no deseados (quitar envío)
        console.log('Filtrando tipos de entrega (quitando envío)...');
        await client.query("DELETE FROM tipo_entrega WHERE nombre NOT IN ('Recoger en tienda', 'Punto medio en Soriana Centro');");

        // Verificar que existan los válidos
        const teTienda = await client.query("SELECT * FROM tipo_entrega WHERE nombre = 'Recoger en tienda';");
        if (teTienda.rows.length === 0) {
            await client.query("INSERT INTO tipo_entrega (nombre) VALUES ('Recoger en tienda');");
        }
        const teSoriana = await client.query("SELECT * FROM tipo_entrega WHERE nombre = 'Punto medio en Soriana Centro';");
        if (teSoriana.rows.length === 0) {
            await client.query("INSERT INTO tipo_entrega (nombre) VALUES ('Punto medio en Soriana Centro');");
        }

        // 8. Sembrar 20 nuevas prendas
        console.log('Insertando 20 nuevas prendas al catálogo...');
        for (const p of newProducts) {
            const query = `
                INSERT INTO producto (nombre, descripcion, precio, talla, marca, condicion, url_imagen, id_estado)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 1);
            `;
            const values = [p.nombre, p.descripcion, p.precio, p.talla, p.marca, p.condicion, p.url_imagen];
            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log('¡Base de datos restablecida y repoblada con éxito!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error durante la transacción:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
