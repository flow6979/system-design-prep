---
title: Creational Patterns
order: 3
time: 15
---

# Creational Patterns

Creational patterns ka kaam ek hi hai: **object kaise banega** ye decide karna, taaki client code `new` ke details me na phanse aur object banane ka logic ek jagah rahe.

## ⭐ Singleton

**Ek line me:** poore app me ek class ka sirf ek hi object ho, aur sabko wahi mile.

**Real example:** Swiggy app me ek hi `ConfigManager` ya ek hi DB connection pool. Har screen apna naya pool banaye to connections khatam.

**Kab use karo / kab nahi:**
- Use karo: logger, config, cache manager, connection pool. Jahan shared state sach me ek hi honi chahiye.
- Mat karo: sirf "global variable" chahiye isliye. Testing mushkil hoti hai (mock nahi kar paate).
- Multi-threaded app me **thread-safe** banana zaroori hai, warna do threads do object bana denge.

Java me 2 safe tareeke: **enum singleton** (sabse simple, serialization/reflection safe) aur **double-checked locking** (`volatile` ke saath). C++ me **Meyers singleton**: function ke andar `static` local. C++11 se ye thread-safe guaranteed hai.

```java
public class Main {
    // Tareeka 1: enum singleton (recommended)
    enum Logger {
        INSTANCE;
        void log(String msg) { System.out.println("[LOG] " + msg); }
    }

    // Tareeka 2: double-checked locking
    static class ConfigManager {
        private static volatile ConfigManager instance; // volatile zaroori
        private final String env = "prod";

        private ConfigManager() {} // bahar se new band

        static ConfigManager getInstance() {
            if (instance == null) {                    // 1st check, bina lock
                synchronized (ConfigManager.class) {
                    if (instance == null) {            // 2nd check, lock ke andar
                        instance = new ConfigManager();
                    }
                }
            }
            return instance;
        }
        String getEnv() { return env; }
    }

    public static void main(String[] args) {
        Logger.INSTANCE.log("Order placed");
        ConfigManager a = ConfigManager.getInstance();
        ConfigManager b = ConfigManager.getInstance();
        System.out.println(a == b);   // true
        System.out.println(a.getEnv());
    }
}
```

```cpp
#include <iostream>
#include <string>

class Logger {
public:
    static Logger& getInstance() {
        static Logger instance; // Meyers singleton: C++11 se thread-safe init
        return instance;
    }
    void log(const std::string& msg) { std::cout << "[LOG] " << msg << "\n"; }

    Logger(const Logger&) = delete;            // copy band
    Logger& operator=(const Logger&) = delete; // assign band

private:
    Logger() = default; // bahar se object nahi bana sakte
};

int main() {
    Logger& a = Logger::getInstance();
    Logger& b = Logger::getInstance();
    a.log("Order placed");
    std::cout << std::boolalpha << (&a == &b) << "\n"; // true
    return 0;
}
```

**LLD problems me kahan:** Logger, Parking Lot (`ParkingLot` ek hi), Elevator system ka `ElevatorController`, Rate limiter ka config, BookMyShow ka `BookingService`.

**Interview me bolo:** "Logger ko singleton rakhunga. Java me enum singleton lunga kyunki woh thread-safe hai aur reflection/serialization se bhi nahi tootta. C++ me Meyers singleton."

**Common galti:**
- Double-checked locking me `volatile` bhool jaana. Bina iske half-constructed object dusre thread ko dikh sakta hai.
- Har cheez ko singleton bana dena. Hidden dependency ban jaati hai, test me mock nahi hota.

## ⭐ Factory Method

**Ek line me:** object kaunsa banega (kaunsi subclass) ye decision ek jagah (factory) me rakho, client sirf interface se baat kare.

**Real example:** Swiggy notification: user ki setting ke hisaab se `SMS`, `Email` ya `Push` notification banana. Client bas `factory.create("SMS")` bolta hai.

**Kab use karo / kab nahi:**
- Use karo: jab type runtime pe decide ho (input, config, user choice) aur naye types aate rahein.
- **Simple factory:** ek static method with `switch`. Interview me 90% yahi kaafi hai.
- **Factory Method (GoF):** base class me abstract `createX()`, har subclass apna object banaye. Jab creation logic family ke hisaab se badle.
- Mat karo: sirf ek hi type hai. Seedha `new` karo.

```java
interface Notification { void send(String msg); }

class SmsNotification implements Notification {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}
class EmailNotification implements Notification {
    public void send(String msg) { System.out.println("Email: " + msg); }
}
class PushNotification implements Notification {
    public void send(String msg) { System.out.println("Push: " + msg); }
}

// Simple factory: creation logic ek jagah
class NotificationFactory {
    static Notification create(String type) {
        return switch (type) {
            case "SMS" -> new SmsNotification();
            case "EMAIL" -> new EmailNotification();
            case "PUSH" -> new PushNotification();
            default -> throw new IllegalArgumentException("Unknown: " + type);
        };
    }
}

public class Main {
    public static void main(String[] args) {
        Notification n = NotificationFactory.create("SMS");
        n.send("Aapka order raste me hai");
        NotificationFactory.create("PUSH").send("Delivery boy 2 min door");
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>

class Notification {
public:
    virtual void send(const std::string& msg) = 0;
    virtual ~Notification() = default;
};

class SmsNotification : public Notification {
public:
    void send(const std::string& msg) override { std::cout << "SMS: " << msg << "\n"; }
};
class EmailNotification : public Notification {
public:
    void send(const std::string& msg) override { std::cout << "Email: " << msg << "\n"; }
};
class PushNotification : public Notification {
public:
    void send(const std::string& msg) override { std::cout << "Push: " << msg << "\n"; }
};

// Simple factory
class NotificationFactory {
public:
    static std::unique_ptr<Notification> create(const std::string& type) {
        if (type == "SMS") return std::make_unique<SmsNotification>();
        if (type == "EMAIL") return std::make_unique<EmailNotification>();
        if (type == "PUSH") return std::make_unique<PushNotification>();
        throw std::invalid_argument("Unknown: " + type);
    }
};

int main() {
    auto n = NotificationFactory::create("SMS");
    n->send("Aapka order raste me hai");
    NotificationFactory::create("PUSH")->send("Delivery boy 2 min door");
    return 0;
}
```

**LLD problems me kahan:** Parking Lot (`VehicleFactory`, `ParkingSpotFactory`), Notification system, Chess (`PieceFactory`), Vending Machine (product type), Payment (`PaymentFactory` for UPI/Card).

**Interview me bolo:** "Naya notification type aaye to sirf ek class aur factory me ek case add hoga. Client code nahi badlega, ye Open/Closed ke kareeb hai."

**Common galti:**
- Factory se concrete class return kar dena, interface nahi. Phir client concrete pe depend ho jaata hai.
- Simple factory aur Factory Method ko same bolna. Farak bata do: ek static method vs subclass override.

## ⭐ Builder

**Ek line me:** bahut saare optional fields wala object step-by-step, readable tareeke se banao, bina 10-parameter constructor ke.

**Real example:** Uber ride request: pickup, drop zaroori. Ride type, coupon, stops, pet-friendly, scheduled time optional. `new Ride(a, b, null, null, true, null...)` padhna impossible hai.

**Kab use karo / kab nahi:**
- Use karo: 4+ parameters, kaafi optional, aur object immutable chahiye.
- Validation `build()` me ek jagah kar sakte ho.
- Mat karo: 2–3 fields wala simple object. Overkill hai.

```java
public class Main {
    static class Ride {
        private final String pickup, drop;   // required
        private final String rideType;       // optional
        private final String coupon;         // optional
        private final boolean petFriendly;   // optional

        private Ride(Builder b) {
            this.pickup = b.pickup; this.drop = b.drop;
            this.rideType = b.rideType; this.coupon = b.coupon;
            this.petFriendly = b.petFriendly;
        }
        public String toString() {
            return pickup + " -> " + drop + " | " + rideType
                + " | coupon=" + coupon + " | pet=" + petFriendly;
        }

        static class Builder {
            private final String pickup, drop;
            private String rideType = "Mini";
            private String coupon;
            private boolean petFriendly;

            Builder(String pickup, String drop) { this.pickup = pickup; this.drop = drop; }
            Builder rideType(String t) { this.rideType = t; return this; }
            Builder coupon(String c) { this.coupon = c; return this; }
            Builder petFriendly(boolean p) { this.petFriendly = p; return this; }
            Ride build() {
                if (pickup.equals(drop)) throw new IllegalStateException("Same location");
                return new Ride(this);
            }
        }
    }

    public static void main(String[] args) {
        Ride ride = new Ride.Builder("Koramangala", "Airport")
            .rideType("Sedan").coupon("FIRST50").petFriendly(true).build();
        System.out.println(ride);
    }
}
```

```cpp
#include <iostream>
#include <stdexcept>
#include <string>
#include <utility>

class Ride {
public:
    class Builder;
    void print() const {
        std::cout << pickup << " -> " << drop << " | " << rideType
                  << " | coupon=" << coupon << " | pet=" << petFriendly << "\n";
    }
private:
    std::string pickup, drop, rideType, coupon;
    bool petFriendly = false;
    Ride() = default;
};

class Ride::Builder {
public:
    Builder(std::string p, std::string d) { r.pickup = std::move(p); r.drop = std::move(d); r.rideType = "Mini"; }
    Builder& rideType(const std::string& t) { r.rideType = t; return *this; }
    Builder& coupon(const std::string& c) { r.coupon = c; return *this; }
    Builder& petFriendly(bool p) { r.petFriendly = p; return *this; }
    Ride build() {
        if (r.pickup == r.drop) throw std::logic_error("Same location");
        return r;
    }
private:
    Ride r;
};

int main() {
    Ride ride = Ride::Builder("Koramangala", "Airport")
                    .rideType("Sedan").coupon("FIRST50").petFriendly(true).build();
    ride.print();
    return 0;
}
```

**LLD problems me kahan:** Uber/Ola ride request, Pizza/burger order customization, HTTP request object, Splitwise `Expense` (split type, participants, notes), Elevator `Request`.

**Interview me bolo:** "Ride me bahut optional fields hain, isliye Builder lunga. Object immutable rahega aur validation `build()` me ek jagah hogi."

**Common galti:**
- Builder bana diya par main class ke fields `final` nahi rakhe. Immutability ka fayda gaya.
- Required fields ko bhi optional setter bana dena. Required ko Builder ke constructor me lo.

## Abstract Factory

**Ek line me:** ek poori **family** of related objects banao jo saath me match karein, bina concrete class bataye.

**Real example:** App ka Dark theme vs Light theme. Dark theme me Button bhi dark, Checkbox bhi dark. Mix nahi hona chahiye. Ya payment gateway family: Razorpay ka `Payment` + `Refund` saath, Paytm ka saath.

**Kab use karo / kab nahi:**
- Use karo: multiple products jo hamesha saath badalte hain (UI theme, OS-specific widgets, DB driver family).
- Mat karo: sirf ek product hai. Wahan simple Factory kaafi hai.
- Downside: family me naya product (jaise `Slider`) add karna sab factories ko badalta hai.

```java
interface Button { void render(); }
interface Checkbox { void render(); }

class DarkButton implements Button { public void render() { System.out.println("Dark Button"); } }
class DarkCheckbox implements Checkbox { public void render() { System.out.println("Dark Checkbox"); } }
class LightButton implements Button { public void render() { System.out.println("Light Button"); } }
class LightCheckbox implements Checkbox { public void render() { System.out.println("Light Checkbox"); } }

// Abstract factory: poori family banata hai
interface ThemeFactory {
    Button createButton();
    Checkbox createCheckbox();
}
class DarkThemeFactory implements ThemeFactory {
    public Button createButton() { return new DarkButton(); }
    public Checkbox createCheckbox() { return new DarkCheckbox(); }
}
class LightThemeFactory implements ThemeFactory {
    public Button createButton() { return new LightButton(); }
    public Checkbox createCheckbox() { return new LightCheckbox(); }
}

public class Main {
    static void renderScreen(ThemeFactory f) { // client ko concrete class nahi pata
        f.createButton().render();
        f.createCheckbox().render();
    }
    public static void main(String[] args) {
        boolean nightMode = true;
        renderScreen(nightMode ? new DarkThemeFactory() : new LightThemeFactory());
    }
}
```

```cpp
#include <iostream>
#include <memory>

class Button { public: virtual void render() = 0; virtual ~Button() = default; };
class Checkbox { public: virtual void render() = 0; virtual ~Checkbox() = default; };

class DarkButton : public Button { public: void render() override { std::cout << "Dark Button\n"; } };
class DarkCheckbox : public Checkbox { public: void render() override { std::cout << "Dark Checkbox\n"; } };
class LightButton : public Button { public: void render() override { std::cout << "Light Button\n"; } };
class LightCheckbox : public Checkbox { public: void render() override { std::cout << "Light Checkbox\n"; } };

class ThemeFactory {
public:
    virtual std::unique_ptr<Button> createButton() = 0;
    virtual std::unique_ptr<Checkbox> createCheckbox() = 0;
    virtual ~ThemeFactory() = default;
};
class DarkThemeFactory : public ThemeFactory {
public:
    std::unique_ptr<Button> createButton() override { return std::make_unique<DarkButton>(); }
    std::unique_ptr<Checkbox> createCheckbox() override { return std::make_unique<DarkCheckbox>(); }
};
class LightThemeFactory : public ThemeFactory {
public:
    std::unique_ptr<Button> createButton() override { return std::make_unique<LightButton>(); }
    std::unique_ptr<Checkbox> createCheckbox() override { return std::make_unique<LightCheckbox>(); }
};

void renderScreen(ThemeFactory& f) {
    f.createButton()->render();
    f.createCheckbox()->render();
}

int main() {
    bool nightMode = true;
    std::unique_ptr<ThemeFactory> f;
    if (nightMode) f = std::make_unique<DarkThemeFactory>();
    else f = std::make_unique<LightThemeFactory>();
    renderScreen(*f);
    return 0;
}
```

**LLD problems me kahan:** UI theme / cross-platform UI, Payment gateway family (pay + refund + webhook parser), DB access layer (MySQL vs Postgres connection + query builder), Chess with different piece sets.

**Interview me bolo:** "Factory ek product banati hai, Abstract Factory ek poori matching family. Theme switch karne pe sirf factory badlegi, baaki code same."

**Common galti:**
- Factory Method aur Abstract Factory ko mix kar dena. Abstract Factory = factories ka interface, multiple products.
- Chhote problem me Abstract Factory laga dena. Interviewer over-engineering samjhega.

## Prototype

**Ek line me:** naya object scratch se banane ki jagah existing object ko **clone** karo, phir thoda badlo.

**Real example:** Zomato pe "Repeat last order": purana order copy karo, bas address ya quantity badlo. Ya game me ek enemy template clone karke 100 enemies.

**Kab use karo / kab nahi:**
- Use karo: object banana mehenga hai (DB/network se load, heavy config) aur similar objects bahut chahiye.
- Mat karo: object simple hai, `new` sasta hai.
- Dhyan: **deep copy vs shallow copy**. List/map fields ko naya copy karo, warna dono object same list share karenge.

```java
import java.util.ArrayList;
import java.util.List;

interface Prototype<T> { T copy(); }

class Order implements Prototype<Order> {
    String restaurant;
    String address;
    List<String> items;

    Order(String restaurant, String address, List<String> items) {
        this.restaurant = restaurant; this.address = address; this.items = items;
    }
    // Deep copy: items ki nayi list
    public Order copy() {
        return new Order(restaurant, address, new ArrayList<>(items));
    }
    public String toString() { return restaurant + " -> " + address + " " + items; }
}

public class Main {
    public static void main(String[] args) {
        Order last = new Order("Meghana Biryani", "Home",
            new ArrayList<>(List.of("Chicken Biryani", "Raita")));

        Order repeat = last.copy();
        repeat.address = "Office";
        repeat.items.add("Gulab Jamun");

        System.out.println(last);   // original same rahega
        System.out.println(repeat);
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>
#include <utility>

class Order {
public:
    std::string restaurant, address;
    std::vector<std::string> items;

    Order(std::string r, std::string a, std::vector<std::string> i)
        : restaurant(std::move(r)), address(std::move(a)), items(std::move(i)) {}
    virtual ~Order() = default;

    // virtual clone: subclass bhi sahi type ka copy dega
    virtual std::unique_ptr<Order> clone() const { return std::make_unique<Order>(*this); }

    void print() const {
        std::cout << restaurant << " -> " << address << " [";
        for (const auto& it : items) std::cout << it << ", ";
        std::cout << "]\n";
    }
};

int main() {
    Order last("Meghana Biryani", "Home", {"Chicken Biryani", "Raita"});
    auto repeat = last.clone();   // vector by value copy hota hai = deep copy
    repeat->address = "Office";
    repeat->items.push_back("Gulab Jamun");

    last.print();
    repeat->print();
    return 0;
}
```

**LLD problems me kahan:** "Repeat order" in food delivery, Game objects (Snake & Ladder board templates, Chess board reset), Document/template copy, Cache me rakhe default config ka copy.

**Interview me bolo:** "Object banana mehenga hai to ek prototype rakh ke clone karunga, aur mutable fields ka deep copy karunga taaki original affect na ho."

**Common galti:**
- Java me `Object.clone()` use karna aur shallow copy se list share ho jaana. Copy constructor ya apna `copy()` better hai.
- C++ me raw pointer members ke saath default copy constructor pe bharosa karna (shallow copy, double delete).

## Checklist

- [ ] Thread-safe Singleton Java (enum / double-checked locking with `volatile`) aur C++ (Meyers) me likh sakta hoon
- [ ] Singleton kab galat choice hai (testing, hidden dependency) bata sakta hoon
- [ ] Simple Factory vs Factory Method vs Abstract Factory ka farak bata sakta hoon
- [ ] Uber ride ya pizza order ke liye Builder code se likh sakta hoon
- [ ] Builder me required vs optional fields aur `build()` validation samjha sakta hoon
- [ ] Prototype me deep vs shallow copy ka issue samjha sakta hoon
- [ ] Parking Lot / Notification jaise LLD problem me kaunsa creational pattern lagega, bata sakta hoon
