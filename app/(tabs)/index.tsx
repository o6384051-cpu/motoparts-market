import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const ORANGE = "#F47C20";
const NAVY = "#0B1F33";
const CREAM = "#F8F5EF";
const MUTED = "#667085";
const GREEN = "#16835B";

type Vehicle = "سيارات" | "دراجات نارية";
type Product = {
  id: string;
  name: string;
  category: string;
  vehicle: Vehicle;
  price: number;
  compatibility: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  featured?: boolean;
};
type CartLine = Product & { quantity: number };
type Order = {
  id: string;
  date: string;
  total: number;
  itemCount: number;
  status: string;
};
type Sale = {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  total: number;
};

const PRODUCTS: Product[] = [
  {
    id: "car-oil-filter",
    name: "فلتر زيت",
    category: "فلاتر",
    vehicle: "سيارات",
    price: 32,
    compatibility: "تويوتا، نيسان، هيونداي",
    icon: "filter-alt",
    color: "#DDEAF2",
    featured: true,
  },
  {
    id: "car-brake-pads",
    name: "فحمات فرامل أمامية",
    category: "فرامل",
    vehicle: "سيارات",
    price: 145,
    compatibility: "تويوتا كامري 2018–2023",
    icon: "disc-full",
    color: "#F6E2D3",
    featured: true,
  },
  {
    id: "car-air-filter",
    name: "فلتر هواء",
    category: "فلاتر",
    vehicle: "سيارات",
    price: 48,
    compatibility: "كيا، هوندا، مازدا",
    icon: "air",
    color: "#E6E2F5",
  },
  {
    id: "car-spark-plug",
    name: "بواجي إشعال",
    category: "محرك",
    vehicle: "سيارات",
    price: 38,
    compatibility: "طقم 4 حبات — محركات بنزين",
    icon: "bolt",
    color: "#F8E9B8",
  },
  {
    id: "car-battery",
    name: "بطارية سيارة",
    category: "كهرباء",
    vehicle: "سيارات",
    price: 360,
    compatibility: "60 أمبير — ضمان سنة",
    icon: "battery-full",
    color: "#D9EBD9",
  },
  {
    id: "car-water-pump",
    name: "مضخة ماء",
    category: "محرك",
    vehicle: "سيارات",
    price: 210,
    compatibility: "تويوتا يارس وكورولا",
    icon: "water-drop",
    color: "#D8EEF3",
  },
  {
    id: "bike-air-filter",
    name: "فلتر هواء للدراجة",
    category: "فلاتر",
    vehicle: "دراجات نارية",
    price: 29,
    compatibility: "هوندا، ياماها، سوزوكي",
    icon: "air",
    color: "#E6E2F5",
    featured: true,
  },
  {
    id: "bike-brake-pads",
    name: "فحمات فرامل أمامية",
    category: "فرامل",
    vehicle: "دراجات نارية",
    price: 42,
    compatibility: "دراجات 125–250 سي سي",
    icon: "disc-full",
    color: "#F6E2D3",
  },
  {
    id: "bike-chain",
    name: "سلسلة دراجة نارية",
    category: "نقل الحركة",
    vehicle: "دراجات نارية",
    price: 115,
    compatibility: "سلسلة 428 — 132 وصلة",
    icon: "link",
    color: "#E5E8EC",
  },
  {
    id: "bike-spark-plug",
    name: "بوجي",
    category: "محرك",
    vehicle: "دراجات نارية",
    price: 18,
    compatibility: "ياماها، كاواساكي، KTM",
    icon: "bolt",
    color: "#F8E9B8",
  },
  {
    id: "bike-battery",
    name: "بطارية دراجة",
    category: "كهرباء",
    vehicle: "دراجات نارية",
    price: 95,
    compatibility: "12 فولت — 7 أمبير",
    icon: "battery-full",
    color: "#D9EBD9",
  },
  {
    id: "bike-tire",
    name: "إطار خلفي",
    category: "إطارات",
    vehicle: "دراجات نارية",
    price: 175,
    compatibility: "مقاس 130/70–17",
    icon: "tire-repair",
    color: "#E3E5E8",
  },
];

const STORAGE_CART = "motoparts-cart-v1";
const STORAGE_ORDERS = "motoparts-orders-v1";
const STORAGE_INVENTORY = "motoparts-inventory-v1";
const STORAGE_SALES = "motoparts-sales-v1";
const STOCK_SEED: Record<string, number> = {
  "car-oil-filter": 8,
  "car-brake-pads": 3,
  "car-air-filter": 12,
  "car-spark-plug": 2,
  "car-battery": 7,
  "car-water-pump": 4,
  "bike-air-filter": 9,
  "bike-brake-pads": 2,
  "bike-chain": 6,
  "bike-spark-plug": 14,
  "bike-battery": 1,
  "bike-tire": 5,
};
const LOW_STOCK_LIMIT = 3;
const MODEL_FILTERS = [
  "تويوتا كورولا",
  "تويوتا كامري",
  "نيسان صني",
  "هيونداي إلنترا",
  "ياماها YBR 125",
  "هوندا CG 125",
];
const PRODUCT_MODELS: Record<string, string[]> = {
  "car-oil-filter": [
    "تويوتا كورولا",
    "تويوتا كامري",
    "نيسان صني",
    "هيونداي إلنترا",
  ],
  "car-brake-pads": ["تويوتا كامري", "تويوتا كورولا", "نيسان ألتيما"],
  "car-air-filter": ["تويوتا كورولا", "كيا سيراتو", "هوندا سيفيك", "مازدا 3"],
  "car-spark-plug": [
    "تويوتا كورولا",
    "هيونداي إلنترا",
    "كيا سيراتو",
    "هوندا سيفيك",
  ],
  "car-battery": ["تويوتا كورولا", "تويوتا كامري", "نيسان صني", "كيا سيراتو"],
  "car-water-pump": ["تويوتا يارس", "تويوتا كورولا"],
  "bike-air-filter": ["هوندا CG 125", "ياماها YBR 125", "سوزوكي GN 125"],
  "bike-brake-pads": ["هوندا CG 125", "ياماها YBR 125", "KTM 200"],
  "bike-chain": ["ياماها YBR 125", "سوزوكي GN 125"],
  "bike-spark-plug": ["ياماها YBR 125", "كاواساكي نينجا 250", "KTM 200"],
  "bike-battery": ["هوندا CG 125", "ياماها YBR 125", "سوزوكي GN 125"],
  "bike-tire": ["هوندا CG 125", "ياماها YBR 125", "سوزوكي GN 125"],
};

function money(value: number) {
  return `${value.toLocaleString("ar-SA")} ر.س`;
}

function ProductArtwork({
  product,
  large = false,
}: {
  product: Product;
  large?: boolean;
}) {
  return (
    <View
      style={[
        styles.artwork,
        { backgroundColor: product.color },
        large && styles.artworkLarge,
      ]}
    >
      <MaterialIcons name={product.icon} size={large ? 68 : 38} color={NAVY} />
      <Text style={styles.artworkLabel}>
        {product.vehicle === "سيارات" ? "AUTO" : "MOTO"}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const [tab, setTab] = useState<
    "home" | "catalog" | "cart" | "orders" | "admin"
  >("home");
  const [vehicle, setVehicle] = useState<Vehicle | "الكل">("الكل");
  const [category, setCategory] = useState("الكل");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] =
    useState<Record<string, number>>(STOCK_SEED);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleProductId, setSaleProductId] = useState(PRODUCTS[0].id);
  const [saleQuantity, setSaleQuantity] = useState("1");
  const [selected, setSelected] = useState<Product | null>(null);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [notice, setNotice] = useState("");
  const isDesktop = Platform.OS === "web";

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_CART).then(
      (saved) => saved && setCart(JSON.parse(saved)),
    );
    AsyncStorage.getItem(STORAGE_ORDERS).then(
      (saved) => saved && setOrders(JSON.parse(saved)),
    );
    AsyncStorage.getItem(STORAGE_INVENTORY).then(
      (saved) => saved && setInventory({ ...STOCK_SEED, ...JSON.parse(saved) }),
    );
    AsyncStorage.getItem(STORAGE_SALES).then(
      (saved) => saved && setSales(JSON.parse(saved)),
    );
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  const categories = useMemo(
    () => [
      "الكل",
      ...Array.from(
        new Set(
          PRODUCTS.filter(
            (p) => vehicle === "الكل" || p.vehicle === vehicle,
          ).map((p) => p.category),
        ),
      ),
    ],
    [vehicle],
  );
  const filtered = useMemo(
    () =>
      PRODUCTS.filter((p) => {
        const matchesVehicle = vehicle === "الكل" || p.vehicle === vehicle;
        const matchesCategory = category === "الكل" || p.category === category;
        const searchableText =
          `${p.name} ${p.compatibility} ${p.category} ${(PRODUCT_MODELS[p.id] ?? []).join(" ")}`.toLocaleLowerCase(
            "ar",
          );
        const matchesQuery =
          !query.trim() ||
          searchableText.includes(query.trim().toLocaleLowerCase("ar"));
        return matchesVehicle && matchesCategory && matchesQuery;
      }),
    [vehicle, category, query],
  );
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = cart.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const lowStockProducts = PRODUCTS.filter(
    (product) => (inventory[product.id] ?? 0) <= LOW_STOCK_LIMIT,
  );
  const salesTotal = sales.reduce((sum, sale) => sum + sale.total, 0);

  function selectVehicle(next: Vehicle | "الكل") {
    setVehicle(next);
    setCategory("الكل");
  }

  function addToCart(product: Product) {
    if ((inventory[product.id] ?? 0) <= 0) {
      setNotice("هذه القطعة غير متوفرة حاليًا");
      setTimeout(() => setNotice(""), 2200);
      return;
    }
    setCart((current) => {
      const found = current.find((line) => line.id === product.id);
      return found
        ? current.map((line) =>
            line.id === product.id
              ? { ...line, quantity: line.quantity + 1 }
              : line,
          )
        : [...current, { ...product, quantity: 1 }];
    });
    setNotice(`تمت إضافة «${product.name}» إلى السلة`);
    setTimeout(() => setNotice(""), 2200);
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) =>
      current.flatMap((line) =>
        line.id !== id
          ? [line]
          : line.quantity + delta <= 0
            ? []
            : [{ ...line, quantity: line.quantity + delta }],
      ),
    );
  }

  async function placeOrder() {
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerAddress.trim()
    ) {
      setNotice("أكمل بيانات الاستلام أولًا");
      setTimeout(() => setNotice(""), 2200);
      return;
    }
    const order: Order = {
      id: `MP-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString("ar-SA"),
      total: cartTotal,
      itemCount: cartCount,
      status: "قيد التجهيز",
    };
    const nextInventory = { ...inventory };
    cart.forEach((line) => {
      nextInventory[line.id] = Math.max(
        0,
        (nextInventory[line.id] ?? 0) - line.quantity,
      );
    });
    setInventory(nextInventory);
    const nextSales = cart.map((line) => ({
      id: `${order.id}-${line.id}`,
      date: order.date,
      productName: line.name,
      quantity: line.quantity,
      total: line.price * line.quantity,
    }));
    setSales((current) => [...nextSales, ...current]);
    await AsyncStorage.setItem(
      STORAGE_SALES,
      JSON.stringify([...nextSales, ...sales]),
    );
    const nextOrders = [order, ...orders];
    setOrders(nextOrders);
    await AsyncStorage.setItem(STORAGE_ORDERS, JSON.stringify(nextOrders));
    setCart([]);
    setCheckoutVisible(false);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setTab("orders");
    setNotice("تم حفظ طلبك على الجهاز بنجاح");
    setTimeout(() => setNotice(""), 2600);
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}
      onPress={() => setSelected(item)}
    >
      <ProductArtwork product={item} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.compatibility} numberOfLines={1}>
          {item.compatibility}
        </Text>
        <View style={styles.productBottom}>
          <Text style={styles.price}>{money(item.price)}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() => addToCart(item)}
          >
            <MaterialIcons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  function Header({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>موتو بارتس ماركت</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        <Pressable style={styles.cartBubble} onPress={() => setTab("cart")}>
          <MaterialIcons name="shopping-cart" size={23} color={NAVY} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  function Home() {
    return (
      <FlatList
        data={filtered.filter((p) => p.featured)}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        columnWrapperStyle={styles.gridGap}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <Header
              title="قطعك عندنا"
              subtitle="تصفح القطع المناسبة لمركبتك بسهولة"
            />
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={22} color={MUTED} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحث باسم المركبة أو القطعة"
                placeholderTextColor="#98A2B3"
                style={styles.searchInput}
                onSubmitEditing={() => setTab("catalog")}
              />
            </View>
            <View style={styles.vehicleRow}>
              {(["الكل", "سيارات", "دراجات نارية"] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => selectVehicle(item)}
                  style={[
                    styles.vehiclePill,
                    vehicle === item && styles.vehiclePillActive,
                  ]}
                >
                  <MaterialIcons
                    name={
                      item === "دراجات نارية"
                        ? "two-wheeler"
                        : item === "سيارات"
                          ? "directions-car"
                          : "apps"
                    }
                    size={18}
                    color={vehicle === item ? "#fff" : NAVY}
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      vehicle === item && styles.vehicleTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modelHeading}>
              <Text style={styles.sectionTitle}>ابحث بالمركبة</Text>
              <Text style={styles.modelHint}>ستظهر كل القطع المتوافقة</Text>
            </View>
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={MODEL_FILTERS}
              keyExtractor={(item) => `model-home-${item}`}
              contentContainerStyle={styles.modelRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setQuery(item);
                    setTab("catalog");
                  }}
                  style={styles.modelChip}
                >
                  <MaterialIcons
                    name="directions-car"
                    size={15}
                    color={ORANGE}
                  />
                  <Text style={styles.modelChipText}>{item}</Text>
                </Pressable>
              )}
            />
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الأكثر طلبًا</Text>
              <Pressable onPress={() => setTab("catalog")}>
                <Text style={styles.link}>عرض الكل</Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>لا توجد قطع مطابقة حاليًا.</Text>
        }
      />
    );
  }

  function Catalog() {
    return (
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        columnWrapperStyle={styles.gridGap}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <Header
              title="كتالوج القطع"
              subtitle={`${filtered.length} قطعة متاحة دون اتصال`}
            />
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={22} color={MUTED} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="ابحث باسم المركبة أو قطعة الغيار"
                placeholderTextColor="#98A2B3"
                style={styles.searchInput}
              />
            </View>
            <View style={styles.vehicleRow}>
              {(["الكل", "سيارات", "دراجات نارية"] as const).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => selectVehicle(item)}
                  style={[
                    styles.vehiclePill,
                    vehicle === item && styles.vehiclePillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.vehicleText,
                      vehicle === item && styles.vehicleTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <FlatList
              horizontal
              inverted
              showsHorizontalScrollIndicator={false}
              data={MODEL_FILTERS}
              keyExtractor={(item) => `model-catalog-${item}`}
              contentContainerStyle={styles.modelRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setQuery(item)}
                  style={styles.modelChip}
                >
                  <MaterialIcons
                    name="directions-car"
                    size={15}
                    color={ORANGE}
                  />
                  <Text style={styles.modelChipText}>{item}</Text>
                </Pressable>
              )}
            />
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => setCategory(item)}
                  style={[
                    styles.categoryPill,
                    category === item && styles.categoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item && styles.categoryTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              )}
            />
          </>
        }
      />
    );
  }

  function Cart() {
    return (
      <View style={styles.flex}>
        <FlatList
          data={cart}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContent}
          ListHeaderComponent={
            <Header
              title="سلة المشتريات"
              subtitle={
                cartCount
                  ? `${cartCount} قطع في سلتك`
                  : "السلة جاهزة لإضافة قطعك"
              }
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cartLine}>
              <ProductArtwork product={item} />
              <View style={styles.cartLineMain}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.compatibility}>
                  {item.vehicle} · {money(item.price)}
                </Text>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => changeQuantity(item.id, -1)}
                  >
                    <MaterialIcons name="remove" size={18} color={NAVY} />
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => changeQuantity(item.id, 1)}
                  >
                    <MaterialIcons name="add" size={18} color={NAVY} />
                  </Pressable>
                </View>
              </View>
              <Text style={styles.lineTotal}>
                {money(item.price * item.quantity)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="shopping-cart" size={42} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>السلة فارغة</Text>
              <Text style={styles.empty}>
                أضف قطعًا من الكتالوج لتبدأ طلبك.
              </Text>
              <Pressable
                style={styles.primaryButton}
                onPress={() => setTab("catalog")}
              >
                <Text style={styles.primaryButtonText}>تصفح الكتالوج</Text>
              </Pressable>
            </View>
          }
        />
        {cart.length > 0 && (
          <View style={styles.checkoutBar}>
            <View>
              <Text style={styles.totalLabel}>الإجمالي</Text>
              <Text style={styles.totalValue}>{money(cartTotal)}</Text>
            </View>
            <Pressable
              style={styles.primaryButton}
              onPress={() => setCheckoutVisible(true)}
            >
              <Text style={styles.primaryButtonText}>متابعة الطلب</Text>
              <MaterialIcons name="arrow-back" size={19} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>
    );
  }

  function Orders() {
    return (
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <Header title="طلباتي" subtitle="طلباتك محفوظة على هذا الجهاز" />
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderId}>{item.id}</Text>
                <Text style={styles.compatibility}>
                  {item.date} · {item.itemCount} قطع
                </Text>
              </View>
              <View style={styles.status}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.compatibility}>الإجمالي</Text>
              <Text style={styles.price}>{money(item.total)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={42} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
            <Text style={styles.empty}>
              كل طلب جديد سيظهر هنا حتى بدون إنترنت.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => setTab("catalog")}
            >
              <Text style={styles.primaryButtonText}>ابدأ التسوق</Text>
            </Pressable>
          </View>
        }
      />
    );
  }

  function recordSale() {
    const product = PRODUCTS.find((item) => item.id === saleProductId);
    const quantity = Number.parseInt(saleQuantity, 10);
    const available = inventory[saleProductId] ?? 0;
    if (!product || !Number.isFinite(quantity) || quantity < 1) {
      setNotice("أدخل كمية صحيحة");
      setTimeout(() => setNotice(""), 2200);
      return;
    }
    if (quantity > available) {
      setNotice(`المتاح من هذه القطعة ${available} فقط`);
      setTimeout(() => setNotice(""), 2200);
      return;
    }
    const sale: Sale = {
      id: `SALE-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString("ar-SA"),
      productName: product.name,
      quantity,
      total: product.price * quantity,
    };
    const nextSales = [sale, ...sales];
    setSales(nextSales);
    setInventory((current) => ({
      ...current,
      [product.id]: available - quantity,
    }));
    AsyncStorage.setItem(STORAGE_SALES, JSON.stringify(nextSales));
    setSaleQuantity("1");
    setNotice("تم تسجيل البيع وتحديث المخزون");
    setTimeout(() => setNotice(""), 2400);
  }

  function Admin() {
    return (
      <FlatList
        data={PRODUCTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={
          <>
            <Header
              title="المخزون والمبيعات"
              subtitle="إدارة محلية تعمل دون اتصال"
            />
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{sales.length}</Text>
                <Text style={styles.statLabel}>عمليات البيع</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{money(salesTotal)}</Text>
                <Text style={styles.statLabel}>إجمالي المبيعات</Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  lowStockProducts.length > 0 && styles.statCardAlert,
                ]}
              >
                <Text style={styles.statNumber}>{lowStockProducts.length}</Text>
                <Text style={styles.statLabel}>تنبيهات النقص</Text>
              </View>
            </View>
            {lowStockProducts.length > 0 && (
              <View style={styles.alertCard}>
                <MaterialIcons name="warning" size={23} color="#9A6500" />
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>تنبيه نقص المخزون</Text>
                  <Text style={styles.alertText}>
                    {lowStockProducts.map((item) => item.name).join("، ")}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>تسجيل بيع جديد</Text>
              <Text style={styles.formHint}>
                يُخصم من المخزون ويحفظ على الجهاز مباشرة
              </Text>
              <FlatList
                horizontal
                inverted
                showsHorizontalScrollIndicator={false}
                data={PRODUCTS}
                keyExtractor={(item) => `sale-${item.id}`}
                contentContainerStyle={styles.saleProductsRow}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => setSaleProductId(item.id)}
                    style={[
                      styles.saleProduct,
                      saleProductId === item.id && styles.saleProductActive,
                    ]}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={19}
                      color={saleProductId === item.id ? "#fff" : NAVY}
                    />
                    <Text
                      style={[
                        styles.saleProductText,
                        saleProductId === item.id &&
                          styles.saleProductTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
              <View style={styles.saleActionRow}>
                <TextInput
                  value={saleQuantity}
                  onChangeText={setSaleQuantity}
                  keyboardType="number-pad"
                  style={styles.quantityInput}
                />
                <Pressable style={styles.primaryButton} onPress={recordSale}>
                  <MaterialIcons name="point-of-sale" size={19} color="#fff" />
                  <Text style={styles.primaryButtonText}>حفظ البيع</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>كميات المخزون</Text>
              <Text style={styles.link}>{PRODUCTS.length} أصناف</Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const stock = inventory[item.id] ?? 0;
          const isLow = stock <= LOW_STOCK_LIMIT;
          return (
            <View style={styles.stockRow}>
              <ProductArtwork product={item} />
              <View style={styles.stockInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.compatibility}>
                  {item.vehicle} · {item.category}
                </Text>
              </View>
              <View style={[styles.stockBadge, isLow && styles.stockBadgeLow]}>
                <Text
                  style={[styles.stockNumber, isLow && styles.stockNumberLow]}
                >
                  {stock}
                </Text>
                <Text
                  style={[styles.stockCaption, isLow && styles.stockNumberLow]}
                >
                  {isLow ? "منخفض" : "متوفر"}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          sales.length > 0 ? (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>آخر المبيعات</Text>
                <Text style={styles.link}>{sales.length} عملية</Text>
              </View>
              {sales.slice(0, 4).map((sale) => (
                <View key={sale.id} style={styles.saleRow}>
                  <View>
                    <Text style={styles.productName}>{sale.productName}</Text>
                    <Text style={styles.compatibility}>
                      {sale.date} · كمية {sale.quantity}
                    </Text>
                  </View>
                  <Text style={styles.price}>{money(sale.total)}</Text>
                </View>
              ))}
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <ScreenContainer containerClassName="bg-[#F8F5EF]" className="p-0">
      <View style={[styles.flex, isDesktop && styles.desktopShell]}>
        {tab === "home" && <Home />}
        {tab === "catalog" && <Catalog />}
        {tab === "cart" && <Cart />}
        {tab === "orders" && <Orders />}
        {tab === "admin" && <Admin />}
        <View style={[styles.tabBar, isDesktop && styles.desktopTabBar]}>
          {isDesktop && (
            <View style={styles.sidebarBrand}>
              <View style={styles.sidebarMark}>
                <MaterialIcons name="build" size={24} color="#fff" />
              </View>
              <Text style={styles.sidebarTitle}>موتو بارتس</Text>
              <Text style={styles.sidebarSubtitle}>إدارة قطع الغيار</Text>
            </View>
          )}
          {[
            ["home", "home", "الرئيسية"],
            ["catalog", "grid-view", "الكتالوج"],
            ["cart", "shopping-cart", "السلة"],
            ["orders", "receipt-long", "طلباتي"],
            ["admin", "inventory", "الإدارة"],
          ].map(([key, icon, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key as typeof tab)}
              style={({ pressed }) => [
                styles.tabItem,
                isDesktop && styles.desktopTabItem,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons
                name={icon as keyof typeof MaterialIcons.glyphMap}
                size={23}
                color={tab === key ? ORANGE : MUTED}
              />
              <Text
                style={[styles.tabLabel, tab === key && styles.tabLabelActive]}
              >
                {label}
                {key === "cart" && cartCount > 0 ? ` (${cartCount})` : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailSheet}>
            {selected && (
              <>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => setSelected(null)}
                >
                  <MaterialIcons name="close" size={22} color={NAVY} />
                </Pressable>
                <ProductArtwork product={selected} large />
                <Text style={styles.detailTitle}>{selected.name}</Text>
                <Text style={styles.detailMeta}>
                  {selected.vehicle} · {selected.category}
                </Text>
                <Text style={styles.detailDescription}>
                  قطعة موثوقة للاستخدام اليومي، متوافقة مع:{" "}
                  {selected.compatibility}.
                </Text>
                <View style={styles.detailPriceRow}>
                  <Text style={styles.detailPrice}>
                    {money(selected.price)}
                  </Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => {
                      addToCart(selected);
                      setSelected(null);
                    }}
                  >
                    <MaterialIcons
                      name="add-shopping-cart"
                      size={19}
                      color="#fff"
                    />
                    <Text style={styles.primaryButtonText}>أضف للسلة</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={checkoutVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.detailSheet}>
            <Pressable
              style={styles.closeButton}
              onPress={() => setCheckoutVisible(false)}
            >
              <MaterialIcons name="close" size={22} color={NAVY} />
            </Pressable>
            <Text style={styles.detailTitle}>إتمام الطلب</Text>
            <Text style={styles.detailMeta}>
              سيتم حفظ الطلب محليًا دون الحاجة للإنترنت
            </Text>
            <TextInput
              style={styles.formInput}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="الاسم الكامل"
              placeholderTextColor="#98A2B3"
            />
            <TextInput
              style={styles.formInput}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="رقم الجوال"
              placeholderTextColor="#98A2B3"
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.formInput, styles.multiline]}
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="عنوان الاستلام"
              placeholderTextColor="#98A2B3"
              multiline
            />
            <View style={styles.detailPriceRow}>
              <View>
                <Text style={styles.totalLabel}>الإجمالي</Text>
                <Text style={styles.detailPrice}>{money(cartTotal)}</Text>
              </View>
              <Pressable style={styles.primaryButton} onPress={placeOrder}>
                <Text style={styles.primaryButtonText}>تأكيد الطلب</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {notice && (
        <View style={styles.toast}>
          <MaterialIcons name="check-circle" size={20} color="#fff" />
          <Text style={styles.toastText}>{notice}</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 105 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  eyebrow: {
    color: ORANGE,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    marginBottom: 4,
  },
  title: {
    color: NAVY,
    fontSize: 29,
    fontWeight: "800",
    textAlign: "right",
    letterSpacing: -0.4,
  },
  subtitle: { color: MUTED, fontSize: 13, textAlign: "right", marginTop: 5 },
  cartBubble: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NAVY,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  searchBox: {
    height: 54,
    borderRadius: 17,
    backgroundColor: "#fff",
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  searchInput: {
    flex: 1,
    textAlign: "right",
    color: NAVY,
    fontSize: 14,
    marginRight: 9,
  },
  vehicleRow: { flexDirection: "row-reverse", gap: 8, marginBottom: 20 },
  vehiclePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E0D6",
  },
  vehiclePillActive: { backgroundColor: NAVY, borderColor: NAVY },
  vehicleText: { color: NAVY, fontSize: 12, fontWeight: "700" },
  vehicleTextActive: { color: "#fff" },
  sectionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  sectionTitle: { color: NAVY, fontSize: 18, fontWeight: "800" },
  link: { color: ORANGE, fontSize: 13, fontWeight: "800" },
  gridGap: { justifyContent: "space-between", marginBottom: 13 },
  productCard: {
    width: "48.3%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 9,
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  artwork: {
    height: 112,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  artworkLarge: { height: 190, marginBottom: 18 },
  artworkLabel: {
    color: NAVY,
    opacity: 0.42,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginTop: 5,
  },
  productInfo: { paddingHorizontal: 3 },
  productName: {
    color: NAVY,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
  },
  compatibility: {
    color: MUTED,
    fontSize: 11,
    textAlign: "right",
    marginTop: 5,
  },
  productBottom: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 11,
  },
  price: { color: NAVY, fontSize: 13, fontWeight: "900" },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
  },
  modelHeading: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modelHint: { color: MUTED, fontSize: 10, textAlign: "right" },
  modelRow: { gap: 8, paddingBottom: 15 },
  modelChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF1E5",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#F8D1B0",
  },
  modelChipText: { color: NAVY, fontSize: 11, fontWeight: "700" },
  categoryRow: { flexDirection: "row-reverse", gap: 8, paddingBottom: 17 },
  categoryPill: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E0D6",
  },
  categoryPillActive: { backgroundColor: ORANGE, borderColor: ORANGE },
  categoryText: { color: NAVY, fontSize: 12, fontWeight: "700" },
  categoryTextActive: { color: "#fff" },
  empty: { color: MUTED, textAlign: "center", marginTop: 12, lineHeight: 21 },
  emptyState: { alignItems: "center", paddingTop: 75, paddingHorizontal: 30 },
  emptyTitle: { color: NAVY, fontSize: 19, fontWeight: "800", marginTop: 14 },
  primaryButton: {
    backgroundColor: ORANGE,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
    gap: 8,
  },
  primaryButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  checkoutBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 77,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EDE8DF",
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { color: MUTED, fontSize: 11, textAlign: "right" },
  totalValue: { color: NAVY, fontSize: 20, fontWeight: "900", marginTop: 2 },
  cartLine: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  cartLineMain: { flex: 1, marginHorizontal: 11 },
  lineTotal: { color: NAVY, fontSize: 12, fontWeight: "800" },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 10,
    justifyContent: "flex-end",
  },
  quantityButton: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
  },
  quantity: { color: NAVY, fontWeight: "800" },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  orderTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { color: NAVY, fontSize: 15, fontWeight: "900", textAlign: "right" },
  status: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#E7F4EE",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
  statusText: { color: GREEN, fontSize: 11, fontWeight: "800" },
  orderBottom: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1EEE8",
  },
  desktopShell: { flexDirection: "row-reverse" },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EDE8DF",
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    paddingTop: 11,
  },
  tabItem: { alignItems: "center", minWidth: 70 },
  tabLabel: { color: MUTED, fontSize: 10, fontWeight: "700", marginTop: 4 },
  tabLabelActive: { color: ORANGE },
  desktopTabItem: {
    width: "100%",
    minWidth: 0,
    height: 50,
    flexDirection: "row-reverse",
    justifyContent: "flex-start",
    gap: 13,
    paddingHorizontal: 13,
    borderRadius: 13,
    marginBottom: 6,
    alignItems: "center",
  },
  desktopTabBar: {
    position: "relative",
    left: undefined,
    right: undefined,
    bottom: undefined,
    width: 228,
    height: "100%",
    paddingTop: 28,
    paddingHorizontal: 14,
    justifyContent: "flex-start",
    flexDirection: "column",
    backgroundColor: NAVY,
    borderTopWidth: 0,
  },
  sidebarBrand: {
    alignItems: "flex-end",
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 27,
    borderBottomWidth: 1,
    borderBottomColor: "#29445B",
    marginBottom: 18,
  },
  sidebarMark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  sidebarTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "right",
  },
  sidebarSubtitle: {
    color: "#B5C4D0",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,31,51,0.42)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 32,
  },
  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  detailTitle: {
    color: NAVY,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "right",
  },
  detailMeta: { color: MUTED, fontSize: 13, textAlign: "right", marginTop: 5 },
  detailDescription: {
    color: NAVY,
    fontSize: 14,
    lineHeight: 24,
    textAlign: "right",
    marginTop: 18,
  },
  detailPriceRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  detailPrice: { color: NAVY, fontSize: 20, fontWeight: "900" },
  formInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    height: 50,
    paddingHorizontal: 14,
    textAlign: "right",
    color: NAVY,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E6E0D6",
  },
  multiline: { height: 75, paddingTop: 14, textAlignVertical: "top" },
  toast: {
    position: "absolute",
    bottom: 91,
    left: 18,
    right: 18,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: NAVY,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  toastText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  statsRow: { flexDirection: "row-reverse", gap: 8, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 11,
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  statCardAlert: { borderColor: "#F1C66A", backgroundColor: "#FFF8E7" },
  statNumber: {
    color: NAVY,
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
  },
  statLabel: { color: MUTED, fontSize: 10, textAlign: "right", marginTop: 5 },
  alertCard: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    backgroundColor: "#FFF3D1",
    borderRadius: 16,
    padding: 13,
    marginBottom: 14,
    gap: 9,
  },
  alertCopy: { flex: 1 },
  alertTitle: {
    color: "#7A5200",
    fontSize: 13,
    fontWeight: "900",
    textAlign: "right",
  },
  alertText: {
    color: "#9A6500",
    fontSize: 11,
    lineHeight: 18,
    textAlign: "right",
    marginTop: 3,
  },
  formCard: {
    backgroundColor: NAVY,
    borderRadius: 19,
    padding: 15,
    marginBottom: 19,
  },
  formTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "right",
  },
  formHint: {
    color: "#B9C9D8",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
    marginBottom: 13,
  },
  saleProductsRow: { gap: 8, paddingVertical: 3 },
  saleProduct: {
    minWidth: 105,
    maxWidth: 125,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#18334B",
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  saleProductActive: { backgroundColor: ORANGE },
  saleProductText: {
    color: "#D5E0E9",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  saleProductTextActive: { color: "#fff" },
  saleActionRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 13,
  },
  quantityInput: {
    width: 62,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#fff",
    color: NAVY,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
  },
  stockRow: {
    backgroundColor: "#fff",
    borderRadius: 17,
    padding: 10,
    marginBottom: 9,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
  stockInfo: { flex: 1, marginHorizontal: 10 },
  stockBadge: {
    minWidth: 48,
    borderRadius: 11,
    backgroundColor: "#E7F4EE",
    alignItems: "center",
    paddingVertical: 6,
  },
  stockBadgeLow: { backgroundColor: "#FFF0D1" },
  stockNumber: { color: GREEN, fontSize: 17, fontWeight: "900" },
  stockNumberLow: { color: "#A46800" },
  stockCaption: { color: GREEN, fontSize: 9, fontWeight: "800", marginTop: 2 },
  saleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EEE9E1",
  },
});
