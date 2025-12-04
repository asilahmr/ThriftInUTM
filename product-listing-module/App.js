import { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import HomePage from './components/HomePage';
import AddProductPage from './components/AddProductPage';
import MyProductsPage from './components/MyProductsPage';
import EditProductPage from './components/EditProductPage';
import ProfilePage from './components/ProfilePage';
import ChatsPage from './components/ChatsPage';
import BottomNav from './components/BottomNav';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // products will be loaded from the backend; start with empty array
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const currentUserId = 'user1'; // Simulating logged-in user

  const addProduct = (product) => {
    // POST to backend then update local state
    (async () => {
      try {
        const payload = { ...product, sellerId: currentUserId };
        const res = await fetch('http://localhost:3000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const saved = await res.json();
        setProducts(prev => [saved, ...prev]);
        setCurrentPage('myproducts');
      } catch (err) {
        console.error('Failed to add product', err);
      }
    })();
  };

  const updateProduct = (updatedProduct) => {
    (async () => {
      try {
        await fetch(`http://localhost:3000/api/products/${updatedProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct),
        });
        setProducts(prev => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
        setEditingProduct(null);
        setCurrentPage('myproducts');
      } catch (err) {
        console.error('Failed to update product', err);
      }
    })();
  };

  const deleteProduct = (productId) => {
    (async () => {
      try {
        await fetch(`http://localhost:3000/api/products/${productId}`, { method: 'DELETE' });
        setProducts(prev => prev.filter(p => p.id !== productId));
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    })();
  };

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setCurrentPage('edit');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage products={products} />;
      case 'add':
        return <AddProductPage onAddProduct={addProduct} onCancel={() => setCurrentPage('home')} />;
      case 'myproducts':
        return (
          <MyProductsPage
            products={products.filter(p => p.sellerId === currentUserId)}
            onEdit={handleEdit}
            onDelete={deleteProduct}
          />
        );
      case 'edit':
        return editingProduct ? (
          <EditProductPage
            product={editingProduct}
            onUpdateProduct={updateProduct}
            onCancel={() => {
              setEditingProduct(null);
              setCurrentPage('myproducts');
            }}
          />
        ) : null;
      case 'chats':
        return <ChatsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage products={products} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#A30F0F" />
      {renderPage()}
      <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
