import { Navigate, Route, Routes } from "react-router-dom";

import Cart from "./pages/cart/Cart";
import Main from "./pages/main/Main";
import Checkout from "./pages/checkout/Checkout";
import FoodDetails from "./pages/food/FoodDetails";
import ScrollToTop from "./components/ScrollToTop";
import OrderInform from "./pages/order-inform";
import { DashboardLayout } from "./components/layouts/DashboardLayout";
import Profile from "./pages/profile/Profile";
import Orders from "./pages/orders/Orders";
import Favorites from "./pages/favorites/Favorites";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/main" replace />} />
          <Route path="main" element={<Main />} />
          <Route path="foodDetails" element={<FoodDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order-inform" element={<OrderInform />} />
          <Route path="pedidos" element={<Orders />} />
          <Route path="favoritos" element={<Favorites />} />
          <Route path="perfil" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
