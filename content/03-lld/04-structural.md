---
title: Structural Patterns
order: 4
time: 18
---

# Structural Patterns

Structural patterns batate hain ki **classes aur objects ko kaise jodo** (wrap, compose, share) taaki bada structure flexible rahe aur existing code ko chhede bina naya behaviour jud jaaye.

## ⭐ Adapter

**Ek line me:** do incompatible interfaces ko jodo. Ek "converter plug" jo third-party class ko tumhare interface jaisa dikhata hai.

**Real example:** Swiggy ka apna `PaymentGateway` interface hai: `pay(orderId, amountInRupees)`. Razorpay SDK `createPayment(paise)` maangta hai, Paytm `initiateTxn(map)`. Har ek ke liye ek adapter.

**Kab use karo / kab nahi:**
- Use karo: third-party SDK / legacy code ko apne interface ke peeche chhupana hai, jise tum badal nahi sakte.
- Fayda: kal PhonePe aaye to bas naya adapter. Business code same.
- Mat karo: dono classes tumhari hi hain. Seedha interface implement karo.

```java
import java.util.Map;

interface PaymentGateway { boolean pay(String orderId, double rupees); }

// Third-party SDKs (inko badal nahi sakte)
class RazorpaySdk {
    boolean createPayment(String ref, long paise) {
        System.out.println("Razorpay: " + ref + " paise=" + paise); return true;
    }
}
class PaytmSdk {
    String initiateTxn(Map<String, String> params) {
        System.out.println("Paytm: " + params); return "TXN_SUCCESS";
    }
}

// Adapters
class RazorpayAdapter implements PaymentGateway {
    private final RazorpaySdk sdk = new RazorpaySdk();
    public boolean pay(String orderId, double rupees) {
        return sdk.createPayment(orderId, Math.round(rupees * 100)); // rupees -> paise
    }
}
class PaytmAdapter implements PaymentGateway {
    private final PaytmSdk sdk = new PaytmSdk();
    public boolean pay(String orderId, double rupees) {
        String res = sdk.initiateTxn(Map.of("ORDER_ID", orderId, "TXN_AMOUNT", String.valueOf(rupees)));
        return res.equals("TXN_SUCCESS");
    }
}

public class Main {
    public static void main(String[] args) {
        PaymentGateway gw = new RazorpayAdapter();   // config se aa sakta hai
        System.out.println(gw.pay("ORD101", 349.50));
        gw = new PaytmAdapter();
        System.out.println(gw.pay("ORD102", 199.00));
    }
}
```

```cpp
#include <cmath>
#include <iostream>
#include <map>
#include <memory>
#include <string>

class PaymentGateway {
public:
    virtual bool pay(const std::string& orderId, double rupees) = 0;
    virtual ~PaymentGateway() = default;
};
// Third-party SDKs (badal nahi sakte)
struct RazorpaySdk {
    bool createPayment(const std::string& ref, long paise) {
        std::cout << "Razorpay: " << ref << " paise=" << paise << "\n"; return true;
    }
};
struct PaytmSdk {
    std::string initiateTxn(const std::map<std::string, std::string>& p) {
        std::cout << "Paytm: " << p.at("ORDER_ID") << " amt=" << p.at("TXN_AMOUNT") << "\n";
        return "TXN_SUCCESS"; }
};
// Adapters
class RazorpayAdapter : public PaymentGateway {
    RazorpaySdk sdk;
public:
    bool pay(const std::string& orderId, double rupees) override {
        return sdk.createPayment(orderId, std::lround(rupees * 100));
    }
};
class PaytmAdapter : public PaymentGateway {
    PaytmSdk sdk;
public:
    bool pay(const std::string& orderId, double rupees) override {
        return sdk.initiateTxn({{"ORDER_ID", orderId}, {"TXN_AMOUNT", std::to_string(rupees)}}) == "TXN_SUCCESS";
    }
};

int main() {
    std::unique_ptr<PaymentGateway> gw = std::make_unique<RazorpayAdapter>();
    std::cout << gw->pay("ORD101", 349.50) << "\n";
    gw = std::make_unique<PaytmAdapter>();
    std::cout << gw->pay("ORD102", 199.00) << "\n";
    return 0;
}
```

**LLD problems me kahan:** Payment system (multiple gateways), Notification (Twilio/SendGrid/FCM adapters), Logger (log4j/slf4j ke peeche), Maps provider (Google Maps vs MapMyIndia) in Uber.

**Interview me bolo:** "Har payment provider ka SDK alag hai, isliye main ek `PaymentGateway` interface rakhunga aur har provider ka adapter. Naya provider = naya adapter, core code untouched."

**Common galti:**
- Adapter me business logic daal dena. Adapter sirf translate kare (format, units, error codes).
- Adapter aur Facade confuse karna. Adapter interface **convert** karta hai, Facade **simplify**.

## ⭐ Decorator

**Ek line me:** object ko wrap karke runtime pe naya behaviour jodo, bina class badle aur bina subclass explosion ke.

**Real example:** Domino's pizza: base Margherita, upar se Extra Cheese, Jalapeno, Olives. Har topping ek wrapper jo price aur description badhata hai. `CheeseJalapenoOlivePizza` jaisi 50 classes nahi banani.

**Kab use karo / kab nahi:**
- Use karo: features combine ho sakte hain aur runtime pe add/remove hote hain (toppings, add-ons, logging, compression, encryption).
- Java I/O isi pe bana hai: `new BufferedReader(new FileReader(...))`.
- Mat karo: sirf 1–2 fixed combinations hain. Bahut layers ho to debugging mushkil.

```mermaid
classDiagram
  class Pizza {
    <<interface>>
    +cost() int
    +desc() String
  }
  class Margherita
  class ToppingDecorator {
    -Pizza inner
  }
  class ExtraCheese
  class Jalapeno
  Pizza <|.. Margherita
  Pizza <|.. ToppingDecorator
  ToppingDecorator <|-- ExtraCheese
  ToppingDecorator <|-- Jalapeno
  ToppingDecorator o-- Pizza
```

```java
interface Pizza { int cost(); String desc(); }

class Margherita implements Pizza {
    public int cost() { return 199; }
    public String desc() { return "Margherita"; }
}

// Base decorator: andar ek Pizza hold karta hai, wahi interface implement karta hai
abstract class ToppingDecorator implements Pizza {
    protected final Pizza inner;
    ToppingDecorator(Pizza inner) { this.inner = inner; }
}
class ExtraCheese extends ToppingDecorator {
    ExtraCheese(Pizza p) { super(p); }
    public int cost() { return inner.cost() + 60; }
    public String desc() { return inner.desc() + " + Cheese"; }
}
class Jalapeno extends ToppingDecorator {
    Jalapeno(Pizza p) { super(p); }
    public int cost() { return inner.cost() + 40; }
    public String desc() { return inner.desc() + " + Jalapeno"; }
}

public class Main {
    public static void main(String[] args) {
        Pizza p = new Jalapeno(new ExtraCheese(new ExtraCheese(new Margherita())));
        System.out.println(p.desc() + " = Rs " + p.cost()); // 199+60+60+40 = 359
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

class Pizza {
public:
    virtual int cost() const = 0;
    virtual std::string desc() const = 0;
    virtual ~Pizza() = default;
};

class Margherita : public Pizza {
public:
    int cost() const override { return 199; }
    std::string desc() const override { return "Margherita"; }
};

class ToppingDecorator : public Pizza {
protected:
    std::unique_ptr<Pizza> inner;
public:
    explicit ToppingDecorator(std::unique_ptr<Pizza> p) : inner(std::move(p)) {}
};
class ExtraCheese : public ToppingDecorator {
public:
    using ToppingDecorator::ToppingDecorator;
    int cost() const override { return inner->cost() + 60; }
    std::string desc() const override { return inner->desc() + " + Cheese"; }
};
class Jalapeno : public ToppingDecorator {
public:
    using ToppingDecorator::ToppingDecorator;
    int cost() const override { return inner->cost() + 40; }
    std::string desc() const override { return inner->desc() + " + Jalapeno"; }
};

int main() {
    std::unique_ptr<Pizza> p = std::make_unique<Margherita>();
    p = std::make_unique<ExtraCheese>(std::move(p));
    p = std::make_unique<ExtraCheese>(std::move(p));
    p = std::make_unique<Jalapeno>(std::move(p));
    std::cout << p->desc() << " = Rs " << p->cost() << "\n"; // 359
    return 0;
}
```

**LLD problems me kahan:** Pizza/Coffee ordering (Starbucks, Domino's), Logger (timestamp + JSON + encryption decorators), Vending Machine add-ons, Rate limiter ko existing API client pe wrap karna, Parking Lot me add-on services (car wash, EV charging) ka price.

**Interview me bolo:** "Toppings ke combinations explode honge agar subclass banaun, isliye Decorator lunga. Har topping same `Pizza` interface implement karke andar wale ko wrap karegi."

**Common galti:**
- Decorator ko interface implement karwana bhool jaana. Phir use dusre decorator me wrap nahi kar sakte.
- Inheritance se har combination ki class bana dena (class explosion).

## ⭐ Facade

**Ek line me:** bahut saare complex subsystems ke aage ek simple entry point do. Client ko andar ki complexity na dikhe.

**Real example:** Swiggy pe "Place Order" ek button hai. Andar Inventory check, Payment, Restaurant notify, Delivery partner assign, Notification sab hota hai. `OrderFacade.placeOrder()` ye sab orchestrate karta hai.

**Kab use karo / kab nahi:**
- Use karo: client ko 5 services ek fixed order me call karni padti hain. Facade wo sequence ek jagah rakh deta hai.
- Subsystem ab bhi directly use ho sakta hai, Facade use rokta nahi.
- Mat karo: Facade me saari business logic daal ke "God class" mat banao.

```java
class InventoryService { boolean reserve(String item) { System.out.println("Reserved " + item); return true; } }
class PaymentService { boolean charge(String user, int amt) { System.out.println("Charged Rs " + amt); return true; } }
class DeliveryService { void assign(String orderId) { System.out.println("Rider assigned for " + orderId); } }
class NotificationService { void notify(String user, String msg) { System.out.println("To " + user + ": " + msg); } }

// Facade: ek simple method, andar poora flow
class OrderFacade {
    private final InventoryService inventory = new InventoryService();
    private final PaymentService payment = new PaymentService();
    private final DeliveryService delivery = new DeliveryService();
    private final NotificationService notifier = new NotificationService();

    boolean placeOrder(String user, String item, int amount) {
        if (!inventory.reserve(item)) return false;
        if (!payment.charge(user, amount)) return false;
        String orderId = "ORD" + System.currentTimeMillis() % 1000;
        delivery.assign(orderId);
        notifier.notify(user, "Order " + orderId + " confirmed");
        return true;
    }
}

public class Main {
    public static void main(String[] args) {
        OrderFacade swiggy = new OrderFacade();
        swiggy.placeOrder("rahul", "Paneer Butter Masala", 280);
    }
}
```

```cpp
#include <iostream>
#include <string>

class InventoryService { public: bool reserve(const std::string& item) { std::cout << "Reserved " << item << "\n"; return true; } };
class PaymentService { public: bool charge(const std::string&, int amt) { std::cout << "Charged Rs " << amt << "\n"; return true; } };
class DeliveryService { public: void assign(const std::string& id) { std::cout << "Rider assigned for " << id << "\n"; } };
class NotificationService { public: void notify(const std::string& u, const std::string& m) { std::cout << "To " << u << ": " << m << "\n"; } };

class OrderFacade {
    InventoryService inventory;
    PaymentService payment;
    DeliveryService delivery;
    NotificationService notifier;
    int counter = 100;
public:
    bool placeOrder(const std::string& user, const std::string& item, int amount) {
        if (!inventory.reserve(item)) return false;
        if (!payment.charge(user, amount)) return false;
        std::string orderId = "ORD" + std::to_string(++counter);
        delivery.assign(orderId);
        notifier.notify(user, "Order " + orderId + " confirmed");
        return true;
    }
};

int main() {
    OrderFacade swiggy;
    swiggy.placeOrder("rahul", "Paneer Butter Masala", 280);
    return 0;
}
```

**LLD problems me kahan:** BookMyShow `BookingFacade` (seat lock + payment + ticket), Food delivery order placement, Parking Lot `ParkingLotSystem.park(vehicle)` (spot find + ticket + gate), Home theater / smart home "movie mode".

**Interview me bolo:** "Client ko sirf `placeOrder()` dikhega. Inventory, payment, delivery ka orchestration Facade ke andar hoga, isliye client aur subsystems loosely coupled rahenge."

**Common galti:**
- Facade ko God class bana dena jisme har subsystem ka logic ho. Facade sirf delegate kare.
- Facade aur Adapter mix karna. Facade naya simple interface deta hai, Adapter existing interface ko match karata hai.

## ⭐ Proxy

**Ek line me:** asli object ke aage ek same-interface wala "stand-in" rakho jo access control, caching, lazy loading ya logging kare.

**Real example:** **Caching proxy:** Zomato restaurant menu baar baar DB se laane ki jagah proxy pehle cache dekhe. **Protection proxy:** Admin panel me sirf `ADMIN` role hi restaurant delete kar sake.

**Kab use karo / kab nahi:**
- Caching proxy: mehenga call (DB, remote API) aur same data baar baar maanga jaata hai.
- Protection proxy: permission check real object se pehle.
- Virtual proxy: heavy object (image, video) tabhi load karo jab sach me chahiye.
- Mat karo: jab extra layer ka koi fayda nahi. Latency aur complexity badhti hai.

```java
import java.util.HashMap;
import java.util.Map;

interface MenuService { String getMenu(String restaurantId); }

class RealMenuService implements MenuService {
    public String getMenu(String id) {
        System.out.println("DB call for " + id);   // mehenga
        return "Menu of " + id;
    }
}

// Caching + protection proxy: same interface
class MenuServiceProxy implements MenuService {
    private final MenuService real = new RealMenuService();
    private final Map<String, String> cache = new HashMap<>();
    private final String role;

    MenuServiceProxy(String role) { this.role = role; }

    public String getMenu(String id) {
        if (role.equals("BLOCKED")) throw new SecurityException("Access denied");
        return cache.computeIfAbsent(id, real::getMenu); // cache miss pe hi real call
    }
}

public class Main {
    public static void main(String[] args) {
        MenuService menu = new MenuServiceProxy("USER");
        System.out.println(menu.getMenu("R42")); // DB call
        System.out.println(menu.getMenu("R42")); // cache se
        try { new MenuServiceProxy("BLOCKED").getMenu("R42"); }
        catch (SecurityException e) { System.out.println(e.getMessage()); }
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>

class MenuService {
public:
    virtual std::string getMenu(const std::string& id) = 0;
    virtual ~MenuService() = default;
};

class RealMenuService : public MenuService {
public:
    std::string getMenu(const std::string& id) override {
        std::cout << "DB call for " << id << "\n";
        return "Menu of " + id;
    }
};

class MenuServiceProxy : public MenuService {
    std::unique_ptr<MenuService> real = std::make_unique<RealMenuService>();
    std::unordered_map<std::string, std::string> cache;
    std::string role;
public:
    explicit MenuServiceProxy(std::string r) : role(std::move(r)) {}
    std::string getMenu(const std::string& id) override {
        if (role == "BLOCKED") throw std::runtime_error("Access denied");
        auto it = cache.find(id);
        if (it != cache.end()) return it->second;   // cache hit
        return cache[id] = real->getMenu(id);       // miss: real call + store
    }
};

int main() {
    MenuServiceProxy menu("USER");
    std::cout << menu.getMenu("R42") << "\n"; // DB call
    std::cout << menu.getMenu("R42") << "\n"; // cache se
    try { MenuServiceProxy("BLOCKED").getMenu("R42"); }
    catch (const std::runtime_error& e) { std::cout << e.what() << "\n"; }
    return 0;
}
```

**LLD problems me kahan:** Rate limiter (API client ke aage proxy jo limit check kare), Caching layer in URL shortener / menu service, Access control in Splitwise group admin, Lazy image loading in Instagram feed, Logger proxy.

**Interview me bolo:** "Client ko pata bhi nahi chalega ki woh proxy se baat kar raha hai, kyunki interface same hai. Proxy me main caching aur permission check rakhunga, real service clean rahegi."

**Common galti:**
- Proxy aur Decorator confuse karna. Dono wrap karte hain, par Proxy **access control** karta hai (aksar real object khud banata hai), Decorator **features jodta** hai (client wrap karta hai, stack ho sakte hain).
- Caching proxy me invalidation/TTL bhool jaana. Stale data milega.

## Composite

**Ek line me:** tree structure (whole-part) me single item aur group ko **same tareeke** se treat karo.

**Real example:** Swiggy menu: "Combos" category ke andar items bhi hain aur sub-category bhi. Total price nikaalna ho to item ho ya category, bas `price()` call karo. Ya file system: file aur folder dono ka `size()`.

**Kab use karo / kab nahi:**
- Use karo: hierarchy hai (folder/file, org chart, menu, UI component tree) aur client ko leaf vs group ka farak nahi karna.
- Mat karo: structure flat hai, tree nahi.

```java
import java.util.ArrayList;
import java.util.List;

interface MenuComponent { int price(); void print(String indent); }

class MenuItem implements MenuComponent {   // leaf
    private final String name; private final int price;
    MenuItem(String name, int price) { this.name = name; this.price = price; }
    public int price() { return price; }
    public void print(String in) { System.out.println(in + name + " Rs " + price); }
}

class MenuCategory implements MenuComponent { // composite
    private final String name;
    private final List<MenuComponent> children = new ArrayList<>();
    MenuCategory(String name) { this.name = name; }
    MenuCategory add(MenuComponent c) { children.add(c); return this; }
    public int price() { return children.stream().mapToInt(MenuComponent::price).sum(); }
    public void print(String in) {
        System.out.println(in + name + " (total Rs " + price() + ")");
        for (MenuComponent c : children) c.print(in + "  ");
    }
}

public class Main {
    public static void main(String[] args) {
        MenuCategory drinks = new MenuCategory("Drinks").add(new MenuItem("Lassi", 60));
        MenuCategory combo = new MenuCategory("Thali Combo")
            .add(new MenuItem("Dal", 120)).add(new MenuItem("Roti", 30)).add(drinks);
        combo.print("");
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
#include <utility>

class MenuComponent {
public:
    virtual int price() const = 0;
    virtual void print(const std::string& indent) const = 0;
    virtual ~MenuComponent() = default;
};

class MenuItem : public MenuComponent { // leaf
    std::string name; int cost;
public:
    MenuItem(std::string n, int c) : name(std::move(n)), cost(c) {}
    int price() const override { return cost; }
    void print(const std::string& in) const override { std::cout << in << name << " Rs " << cost << "\n"; }
};
class MenuCategory : public MenuComponent { // composite
    std::string name;
    std::vector<std::shared_ptr<MenuComponent>> children;
public:
    explicit MenuCategory(std::string n) : name(std::move(n)) {}
    void add(std::shared_ptr<MenuComponent> c) { children.push_back(std::move(c)); }
    int price() const override {
        int total = 0; for (const auto& c : children) total += c->price(); return total;
    }
    void print(const std::string& in) const override {
        std::cout << in << name << " (total Rs " << price() << ")\n";
        for (const auto& c : children) c->print(in + "  ");
    }
};

int main() {
    auto drinks = std::make_shared<MenuCategory>("Drinks");
    drinks->add(std::make_shared<MenuItem>("Lassi", 60));
    auto combo = std::make_shared<MenuCategory>("Thali Combo");
    combo->add(std::make_shared<MenuItem>("Dal", 120));
    combo->add(std::make_shared<MenuItem>("Roti", 30));
    combo->add(drinks); // category ke andar category
    combo->print("");
    return 0;
}
```

**LLD problems me kahan:** File system design, Restaurant menu, Organization hierarchy (employee/manager), Splitwise groups ke andar sub-groups, Expression tree / calculator, UI component tree.

**Interview me bolo:** "Folder aur file dono `FileSystemNode` implement karenge. Folder ke `size()` me children ka recursive sum hoga, client ko farak nahi padega."

**Common galti:**
- Leaf me `add()` method daal ke exception throw karna jabki zarurat nahi. Child management sirf composite me rakho (safe design).
- Cycle bana dena (folder khud ko child bana le). Recursion infinite.

## Bridge

**Ek line me:** abstraction aur implementation ko alag hierarchies me todo, taaki dono independently badh sakein. Inheritance ki jagah composition.

**Real example:** Notification type (`OrderAlert`, `OtpAlert`) x channel (`SMS`, `WhatsApp`, `Email`). Inheritance se `OtpSms`, `OtpWhatsApp`... 2x3 = 6 classes. Bridge se 2 + 3 = 5, aur naya channel = sirf 1 class.

**Kab use karo / kab nahi:**
- Use karo: do dimensions independently badhte hain (shape x color, remote x device, message x channel).
- Mat karo: sirf ek dimension hai. Wahan simple Strategy ya interface kaafi.

```java
// Implementation hierarchy: channel
interface Channel { void deliver(String to, String text); }
class SmsChannel implements Channel {
    public void deliver(String to, String text) { System.out.println("SMS to " + to + ": " + text); }
}
class WhatsAppChannel implements Channel {
    public void deliver(String to, String text) { System.out.println("WhatsApp to " + to + ": " + text); }
}

// Abstraction hierarchy: message type, andar Channel ka reference (bridge)
abstract class Alert {
    protected final Channel channel;
    Alert(Channel channel) { this.channel = channel; }
    abstract void send(String to);
}
class OtpAlert extends Alert {
    private final String otp;
    OtpAlert(Channel c, String otp) { super(c); this.otp = otp; }
    void send(String to) { channel.deliver(to, "Your OTP is " + otp); }
}
class OrderAlert extends Alert {
    private final String orderId;
    OrderAlert(Channel c, String orderId) { super(c); this.orderId = orderId; }
    void send(String to) { channel.deliver(to, "Order " + orderId + " delivered"); }
}

public class Main {
    public static void main(String[] args) {
        new OtpAlert(new SmsChannel(), "4821").send("9876543210");
        new OrderAlert(new WhatsAppChannel(), "ORD55").send("9876543210");
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

class Channel {
public:
    virtual void deliver(const std::string& to, const std::string& text) = 0;
    virtual ~Channel() = default;
};
class SmsChannel : public Channel {
public:
    void deliver(const std::string& to, const std::string& t) override { std::cout << "SMS to " << to << ": " << t << "\n"; }
};
class WhatsAppChannel : public Channel {
public:
    void deliver(const std::string& to, const std::string& t) override { std::cout << "WhatsApp to " << to << ": " << t << "\n"; }
};

class Alert {
protected:
    std::shared_ptr<Channel> channel; // bridge
public:
    explicit Alert(std::shared_ptr<Channel> c) : channel(std::move(c)) {}
    virtual void send(const std::string& to) = 0;
    virtual ~Alert() = default;
};
class OtpAlert : public Alert {
    std::string otp;
public:
    OtpAlert(std::shared_ptr<Channel> c, std::string o) : Alert(std::move(c)), otp(std::move(o)) {}
    void send(const std::string& to) override { channel->deliver(to, "Your OTP is " + otp); }
};
class OrderAlert : public Alert {
    std::string orderId;
public:
    OrderAlert(std::shared_ptr<Channel> c, std::string id) : Alert(std::move(c)), orderId(std::move(id)) {}
    void send(const std::string& to) override { channel->deliver(to, "Order " + orderId + " delivered"); }
};

int main() {
    OtpAlert(std::make_shared<SmsChannel>(), "4821").send("9876543210");
    OrderAlert(std::make_shared<WhatsAppChannel>(), "ORD55").send("9876543210");
    return 0;
}
```

**LLD problems me kahan:** Notification system (type x channel), Remote control x TV brand, Shape x Renderer (drawing app), Payment type x gateway, Logger (log format x destination).

**Interview me bolo:** "Do independent dimensions hain, isliye inheritance se class explosion hoga. Bridge se message type aur channel alag hierarchies rahenge, composition se jude."

**Common galti:**
- Bridge ko Adapter samajhna. Adapter baad me incompatible cheez jodta hai, Bridge design time pe hi do hierarchies alag rakhta hai.
- Bridge ko Strategy se confuse karna. Structure same dikhta hai, par Bridge me abstraction side bhi apni hierarchy hoti hai.

## Flyweight

**Ek line me:** lakhs similar objects me jo data common hai (intrinsic) use share karo, aur jo alag hai (extrinsic) bahar se pass karo. Memory bachao.

**Real example:** Google Maps / Swiggy map pe 1 lakh restaurant markers. Har marker ka icon image (biryani, pizza) alag object me rakhoge to RAM khatam. Icon share karo, sirf `(lat, lng)` alag.

**Kab use karo / kab nahi:**
- Use karo: bahut zyada objects, aur unka bada hissa same hai (game particles, text editor characters, map markers, chess pieces).
- Flyweight **immutable** hona chahiye, kyunki sab share kar rahe hain.
- Mat karo: objects kam hain. Complexity ka fayda nahi.

```java
import java.util.HashMap;
import java.util.Map;

// Flyweight: intrinsic (shared, immutable) state
final class MarkerIcon {
    private final String cuisine; private final String imageBytes;
    MarkerIcon(String cuisine) {
        this.cuisine = cuisine; this.imageBytes = "<big-png-of-" + cuisine + ">";
        System.out.println("Loaded icon: " + cuisine);
    }
    void draw(double lat, double lng) { // extrinsic state bahar se
        System.out.println(cuisine + " icon at " + lat + "," + lng);
    }
}

class IconFactory {
    private static final Map<String, MarkerIcon> pool = new HashMap<>();
    static MarkerIcon get(String cuisine) {
        return pool.computeIfAbsent(cuisine, MarkerIcon::new);
    }
    static int size() { return pool.size(); }
}

public class Main {
    public static void main(String[] args) {
        String[] cuisines = {"Biryani", "Pizza", "Biryani", "Biryani", "Pizza"};
        for (int i = 0; i < cuisines.length; i++) {
            IconFactory.get(cuisines[i]).draw(12.9 + i * 0.01, 77.6);
        }
        System.out.println("Icons in memory: " + IconFactory.size()); // 2, not 5
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

class MarkerIcon { // flyweight: shared, immutable
    const std::string cuisine;
    const std::string imageBytes;
public:
    explicit MarkerIcon(const std::string& c) : cuisine(c), imageBytes("<big-png-of-" + c + ">") {
        std::cout << "Loaded icon: " << c << "\n";
    }
    void draw(double lat, double lng) const {
        std::cout << cuisine << " icon at " << lat << "," << lng << "\n";
    }
};

class IconFactory {
    std::unordered_map<std::string, std::shared_ptr<const MarkerIcon>> pool;
public:
    std::shared_ptr<const MarkerIcon> get(const std::string& c) {
        auto it = pool.find(c);
        if (it != pool.end()) return it->second;
        auto icon = std::make_shared<const MarkerIcon>(c);
        pool[c] = icon;
        return icon;
    }
    size_t size() const { return pool.size(); }
};

int main() {
    IconFactory factory;
    std::vector<std::string> cuisines = {"Biryani", "Pizza", "Biryani", "Biryani", "Pizza"};
    for (size_t i = 0; i < cuisines.size(); i++)
        factory.get(cuisines[i])->draw(12.9 + i * 0.01, 77.6);
    std::cout << "Icons in memory: " << factory.size() << "\n"; // 2
    return 0;
}
```

**LLD problems me kahan:** Chess (piece type shared, position extrinsic), Text editor (character glyphs), Game (bullets, trees), Map markers in Uber/Swiggy, Parking Lot me spot type metadata.

**Interview me bolo:** "Intrinsic state (icon image) ko share karunga aur extrinsic state (location) har call me pass karunga. Ek factory pool rakhegi taaki ek type ka ek hi object bane."

**Common galti:**
- Flyweight ko mutable rakhna. Ek jagah change sab jagah dikh jaayega.
- Extrinsic state (position) ko bhi flyweight ke andar daal dena. Phir sharing ka fayda khatam.

## Checklist

- [ ] Swiggy payment ke liye Razorpay/Paytm Adapter code se likh sakta hoon
- [ ] Pizza/coffee Decorator likh ke class explosion problem samjha sakta hoon
- [ ] Facade vs Adapter vs Proxy vs Decorator ka farak ek-ek line me bata sakta hoon
- [ ] Caching proxy aur protection proxy ka example de sakta hoon
- [ ] Composite se file system / menu tree design kar sakta hoon
- [ ] Bridge kab lagta hai (do independent dimensions) bata sakta hoon
- [ ] Flyweight me intrinsic vs extrinsic state samjha sakta hoon
