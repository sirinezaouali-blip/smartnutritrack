import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import styles from './Cart.module.css';

const Cart = () => {
  const { userProfile } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart items from localStorage or context
    const loadCartItems = () => {
      try {
        const savedCart = localStorage.getItem('cartItems');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.error('Error loading cart items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCartItems();
  }, []);

  useEffect(() => {
  // Clean up any corrupted cart data
  const cleanupCartData = () => {
    try {
      const savedCart = localStorage.getItem('cartItems');
      if (savedCart) {
        const cartItems = JSON.parse(savedCart);
        const cleanedItems = cartItems.map(item => ({
          ...item,
          price: typeof item.price === 'number' ? item.price : 0
        }));
        localStorage.setItem('cartItems', JSON.stringify(cleanedItems));
        setCartItems(cleanedItems);
      }
    } catch (error) {
      console.error('Error cleaning cart data:', error);
    }
  };

  cleanupCartData();
}, []);

  const updateCartInStorage = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    updateCartInStorage(updatedItems);
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    updateCartInStorage(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cartItems');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalCalories = () => {
    return cartItems.reduce((total, item) => total + (item.calories * item.quantity), 0);
  };

  const proceedToCheckout = () => {
    // Navigate to checkout or meal addition
    navigate('/add-meal', {
      state: {
        cartItems: cartItems,
        totalCalories: getTotalCalories(),
        totalPrice: getTotalPrice()
      }
    });
  };

  if (loading) {
    return (
      <div className={styles.cart}>
        <div className={styles.loading}>Loading cart...</div>
      </div>
    );
  }

  return (
    <div className={styles.cart}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Shopping Cart</h1>
          <p className={styles.subtitle}>
            Review your selected food items
          </p>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <div className={styles.emptyIcon}>
            <FiShoppingBag />
          </div>
          <h2 className={styles.emptyTitle}>Your cart is empty</h2>
          <p className={styles.emptyText}>
            Start scanning food items to add them to your cart
          </p>
          <button
            onClick={() => navigate('/scan-food')}
            className={styles.shopButton}
          >
            Start Scanning
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className={styles.placeholderImage}>
                      <FiShoppingBag />
                    </div>
                  )}
                </div>

                <div className={styles.itemDetails}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <div className={styles.itemMeta}>
                    <span className={styles.calories}>
                      {item.calories} kcal per serving
                    </span>
                    {item.price && (
                      <span className={styles.price}>
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className={styles.quantityButton}
                  >
                    <FiMinus />
                  </button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className={styles.quantityButton}
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className={styles.itemTotal}>
                  <div className={styles.totalCalories}>
                    {(item.calories * item.quantity)} kcal
                  </div>
                  {item.price && (
                    <div className={styles.totalPrice}>
                      ${(typeof item.price === 'number' ? item.price * item.quantity : 0).toFixed(2)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className={styles.removeButton}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className={styles.cartSummary}>
            <div className={styles.summaryRow}>
              <span>Total Items:</span>
              <span>{cartItems.reduce((total, item) => total + item.quantity, 0)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total Calories:</span>
              <span>{getTotalCalories()} kcal</span>
            </div>
            {getTotalPrice() > 0 && (
              <div className={styles.summaryRow}>
                <span>Total Price:</span>
                <span>${getTotalPrice().toFixed(2)}</span>
              </div>
            )}

            <div className={styles.summaryActions}>
              <button
                onClick={clearCart}
                className={styles.clearButton}
              >
                Clear Cart
              </button>
              <button
                onClick={proceedToCheckout}
                className={styles.checkoutButton}
              >
                Add to Meal Diary
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
