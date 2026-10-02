---
title: Creational Patterns
order: 3
time: 15
---

# Creational Patterns

Creational patterns have one job: deciding **how an object gets created**, so client code does not get stuck in the details of `new` and the creation logic stays in one place.

## ⭐ Singleton

**In one line:** the whole app has only one object of a class, and everyone gets that same object.

**Real example:** one `ConfigManager` or one DB connection pool in the Swiggy app. If every screen made its own new pool, you would run out of connections.

**When to use / when not:**
- Use it for: logger, config, cache manager, connection pool. Places where the shared state really must be one.
- Do not use it: just because you want a "global variable". Testing gets hard (you cannot mock it).
- In a multi-threaded app it must be **thread-safe**, or two threads will create two objects.

Two safe ways in Java: **enum singleton** (the simplest, safe against serialization/reflection) and **double-checked locking** (with `volatile`). In C++, the **Meyers singleton**: a `static` local inside a function. Since C++11 this is guaranteed to be thread-safe.

```java
public class Main {
    // Way 1: enum singleton (recommended)
    enum Logger {
        INSTANCE;
        void log(String msg) { System.out.println("[LOG] " + msg); }
    }

    // Way 2: double-checked locking
    static class ConfigManager {
        private static volatile ConfigManager instance; // volatile is required
        private final String env = "prod";

        private ConfigManager() {} // no new from outside

        static ConfigManager getInstance() {
            if (instance == null) {                    // 1st check, without a lock
                synchronized (ConfigManager.class) {
                    if (instance == null) {            // 2nd check, inside the lock
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
        static Logger instance; // Meyers singleton: thread-safe init since C++11
        return instance;
    }
    void log(const std::string& msg) { std::cout << "[LOG] " << msg << "\n"; }

    Logger(const Logger&) = delete;            // no copy
    Logger& operator=(const Logger&) = delete; // no assign

private:
    Logger() = default; // cannot create an object from outside
};

int main() {
    Logger& a = Logger::getInstance();
    Logger& b = Logger::getInstance();
    a.log("Order placed");
    std::cout << std::boolalpha << (&a == &b) << "\n"; // true
    return 0;
}
```

**Where in LLD problems:** Logger, Parking Lot (only one `ParkingLot`), the `ElevatorController` of an Elevator system, the config of a Rate limiter, `BookingService` in BookMyShow.

**Say this in the interview:** "I will keep the Logger as a singleton. In Java I will use an enum singleton because it is thread-safe and does not break through reflection/serialization either. In C++, a Meyers singleton."

**Common mistake:**
- Forgetting `volatile` in double-checked locking. Without it, another thread can see a half-constructed object.
- Making everything a singleton. It becomes a hidden dependency and cannot be mocked in tests.

## ⭐ Factory Method

**In one line:** keep the decision of which object (which subclass) gets created in one place (the factory), and let the client talk only to the interface.

**Real example:** Swiggy notifications: create an `SMS`, `Email` or `Push` notification based on the user's setting. The client just says `factory.create("SMS")`.

**When to use / when not:**
- Use it: when the type is decided at runtime (input, config, user choice) and new types keep coming.
- **Simple factory:** one static method with a `switch`. In 90% of interviews this is enough.
- **Factory Method (GoF):** an abstract `createX()` in the base class, and each subclass creates its own object. Use it when the creation logic changes by family.
- Do not use it: when there is only one type. Just call `new` directly.

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

// Simple factory: creation logic in one place
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
        n.send("Your order is on the way");
        NotificationFactory.create("PUSH").send("Delivery partner is 2 min away");
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
    n->send("Your order is on the way");
    NotificationFactory::create("PUSH")->send("Delivery partner is 2 min away");
    return 0;
}
```

**Where in LLD problems:** Parking Lot (`VehicleFactory`, `ParkingSpotFactory`), Notification system, Chess (`PieceFactory`), Vending Machine (product type), Payment (`PaymentFactory` for UPI/Card).

**Say this in the interview:** "When a new notification type comes, I only add one class and one case in the factory. The client code does not change, which is close to Open/Closed."

**Common mistake:**
- Returning a concrete class from the factory instead of the interface. Then the client depends on the concrete class.
- Saying Simple factory and Factory Method are the same. State the difference: a static method vs a subclass override.

## ⭐ Builder

**In one line:** build an object with many optional fields step by step, in a readable way, without a 10-parameter constructor.

**Real example:** an Uber ride request: pickup and drop are required. Ride type, coupon, stops, pet-friendly, scheduled time are optional. `new Ride(a, b, null, null, true, null...)` is impossible to read.

**When to use / when not:**
- Use it: 4+ parameters, many of them optional, and you want the object to be immutable.
- You can do validation in one place, in `build()`.
- Do not use it: for a simple object with 2–3 fields. It is overkill.

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

**Where in LLD problems:** Uber/Ola ride request, Pizza/burger order customization, HTTP request object, Splitwise `Expense` (split type, participants, notes), Elevator `Request`.

**Say this in the interview:** "A Ride has many optional fields, so I will use a Builder. The object stays immutable and validation happens in one place, in `build()`."

**Common mistake:**
- Making a Builder but not keeping the main class's fields `final`. The benefit of immutability is lost.
- Making required fields optional setters too. Take the required ones in the Builder's constructor.

## Abstract Factory

**In one line:** create a whole **family** of related objects that match each other, without naming the concrete classes.

**Real example:** an app's Dark theme vs Light theme. In the Dark theme, the Button is dark and the Checkbox is dark too. They must not mix. Or a payment gateway family: Razorpay's `Payment` + `Refund` go together, and Paytm's go together.

**When to use / when not:**
- Use it: for multiple products that always change together (UI theme, OS-specific widgets, DB driver family).
- Do not use it: when there is only one product. A simple Factory is enough there.
- Downside: adding a new product to the family (like `Slider`) changes every factory.

```java
interface Button { void render(); }
interface Checkbox { void render(); }

class DarkButton implements Button { public void render() { System.out.println("Dark Button"); } }
class DarkCheckbox implements Checkbox { public void render() { System.out.println("Dark Checkbox"); } }
class LightButton implements Button { public void render() { System.out.println("Light Button"); } }
class LightCheckbox implements Checkbox { public void render() { System.out.println("Light Checkbox"); } }

// Abstract factory: creates the whole family
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
    static void renderScreen(ThemeFactory f) { // the client does not know the concrete class
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

**Where in LLD problems:** UI theme / cross-platform UI, payment gateway family (pay + refund + webhook parser), DB access layer (MySQL vs Postgres connection + query builder), Chess with different piece sets.

**Say this in the interview:** "A Factory creates one product, an Abstract Factory creates a whole matching family. When the theme switches, only the factory changes and the rest of the code stays the same."

**Common mistake:**
- Mixing up Factory Method and Abstract Factory. Abstract Factory = an interface of factories, multiple products.
- Using Abstract Factory in a small problem. The interviewer will see it as over-engineering.

## Prototype

**In one line:** instead of building a new object from scratch, **clone** an existing object and then change a little.

**Real example:** "Repeat last order" on Zomato: copy the old order and just change the address or quantity. Or in a game, clone one enemy template to make 100 enemies.

**When to use / when not:**
- Use it: when creating the object is expensive (loaded from DB/network, heavy config) and you need many similar objects.
- Do not use it: when the object is simple and `new` is cheap.
- Watch out: **deep copy vs shallow copy**. Make a new copy of list/map fields, or both objects will share the same list.

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
    // Deep copy: a new list of items
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

        System.out.println(last);   // the original stays the same
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

    // virtual clone: a subclass also returns a copy of the right type
    virtual std::unique_ptr<Order> clone() const { return std::make_unique<Order>(*this); }

    void print() const {
        std::cout << restaurant << " -> " << address << " [";
        for (const auto& it : items) std::cout << it << ", ";
        std::cout << "]\n";
    }
};

int main() {
    Order last("Meghana Biryani", "Home", {"Chicken Biryani", "Raita"});
    auto repeat = last.clone();   // the vector is copied by value = deep copy
    repeat->address = "Office";
    repeat->items.push_back("Gulab Jamun");

    last.print();
    repeat->print();
    return 0;
}
```

**Where in LLD problems:** "Repeat order" in food delivery, game objects (Snake & Ladder board templates, Chess board reset), document/template copy, a copy of the default config kept in a cache.

**Say this in the interview:** "If creating the object is expensive, I will keep a prototype and clone it, and deep copy the mutable fields so the original is not affected."

**Common mistake:**
- Using `Object.clone()` in Java and ending up sharing a list through a shallow copy. A copy constructor or your own `copy()` is better.
- In C++, relying on the default copy constructor with raw pointer members (shallow copy, double delete).

## Checklist

- [ ] I can write a thread-safe Singleton in Java (enum / double-checked locking with `volatile`) and C++ (Meyers)
- [ ] I can tell when Singleton is the wrong choice (testing, hidden dependency)
- [ ] I can tell the difference between Simple Factory, Factory Method and Abstract Factory
- [ ] I can write Builder code for an Uber ride or a pizza order
- [ ] I can explain required vs optional fields and `build()` validation in a Builder
- [ ] I can explain the deep vs shallow copy issue in Prototype
- [ ] I can tell which creational pattern fits an LLD problem like Parking Lot / Notification
