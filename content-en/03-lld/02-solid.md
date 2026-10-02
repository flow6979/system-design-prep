---
title: SOLID Principles
order: 2
time: 15
---

# SOLID Principles

SOLID is five rules that make code easy to change. In an LLD round, the interviewer adds a new requirement to see whether your design breaks. If you followed SOLID, a new feature = a new class, and the old code stays safe.

## ⭐ S – Single Responsibility

**In one line:** a class should have only one reason to change. One class, one job.

**Real example:** a Zomato invoice: calculating the total, printing the PDF, saving to the DB. Three different teams, three different reasons to change. All three should not be in one class.

**When to use / when not:**
- When you start describing the class with "and" or "also" (calculate **and** print **and** save), split it.
- Do not split so much that every method gets its own class. Think "one reason to change", not "one method".

```java
// ❌ Bad: one class, three reasons to change
class InvoiceBad {
    double amount;
    InvoiceBad(double amount) { this.amount = amount; }
    double total() { return amount * 1.18; }                   // business logic
    void print() { System.out.println("Total: " + total()); }  // presentation
    void saveToDb() { System.out.println("INSERT invoice"); }  // persistence
}

// ✅ Good: each class has one job
class Invoice {
    private final double amount;
    Invoice(double amount) { this.amount = amount; }
    double total() { return amount * 1.18; }   // only the GST calculation
}

class InvoicePrinter {
    void print(Invoice inv) { System.out.println("Total: " + inv.total()); }
}

class InvoiceRepository {
    void save(Invoice inv) { System.out.println("INSERT invoice " + inv.total()); }
}

public class Main {
    public static void main(String[] args) {
        Invoice inv = new Invoice(1000);
        new InvoicePrinter().print(inv);
        new InvoiceRepository().save(inv);
    }
}
```

```cpp
#include <iostream>

// ❌ Bad: one class, three reasons to change
class InvoiceBad {
    double amount;
public:
    explicit InvoiceBad(double a) : amount(a) {}
    double total() const { return amount * 1.18; }                     // business logic
    void print() const { std::cout << "Total: " << total() << "\n"; }  // presentation
    void saveToDb() const { std::cout << "INSERT invoice\n"; }         // persistence
};

// ✅ Good: each class has one job
class Invoice {
    double amount;
public:
    explicit Invoice(double a) : amount(a) {}
    double total() const { return amount * 1.18; }   // only the GST calculation
};

class InvoicePrinter {
public:
    void print(const Invoice& inv) const { std::cout << "Total: " << inv.total() << "\n"; }
};

class InvoiceRepository {
public:
    void save(const Invoice& inv) const { std::cout << "INSERT invoice " << inv.total() << "\n"; }
};

int main() {
    Invoice inv(1000);
    InvoicePrinter{}.print(inv);
    InvoiceRepository{}.save(inv);
}
```

**Where in LLD problems:** in Parking Lot, `ParkingLot` (manages spots), `FeeCalculator` (money) and `TicketService` (tickets) are separate. In Splitwise, `ExpenseService` and `BalanceSheet` are separate.

**Say this in the interview:** "Each class has one reason to change. If the GST rule changes, only `Invoice` changes, not the printer or the DB code."

**Common mistake:**
- Thinking "single responsibility = one method". A class can have many methods if they all belong to one responsibility.

## ⭐ O – Open/Closed

**In one line:** a class is open for extension, closed for modification. New behaviour = a new class. Do not add `if-else` to the old class.

**Real example:** every Flipkart sale brings a new discount (Diwali, Big Billion, Bank offer). Adding a new `else if` to `DiscountCalculator` every time is risky.

**When to use / when not:**
- When you see a `switch` / `if-else` chain on a type and new types will keep coming.
- If there are only 2 fixed cases that will never change, a simple `if` is fine. Do not force abstraction from day one.

```java
import java.util.List;

// ❌ Bad: a new discount = you have to open this method
class DiscountCalculatorBad {
    double apply(String type, double price) {
        if (type.equals("FESTIVE")) return price * 0.8;
        else if (type.equals("PREMIUM")) return price * 0.9;
        return price;   // a new type? one more else-if here...
    }
}

// ✅ Good: a new discount = a new class, old code untouched
interface Discount {
    double apply(double price);
}

class FestiveDiscount implements Discount {
    public double apply(double price) { return price * 0.8; }
}

class PremiumDiscount implements Discount {
    public double apply(double price) { return price * 0.9; }
}

class BankOfferDiscount implements Discount {   // added later, nothing broke
    public double apply(double price) { return price - 100; }
}

public class Main {
    public static void main(String[] args) {
        List<Discount> offers = List.of(new FestiveDiscount(), new PremiumDiscount(), new BankOfferDiscount());
        for (Discount d : offers) {
            System.out.println(d.getClass().getSimpleName() + ": " + d.apply(1000));
        }
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <vector>

// ❌ Bad: a new discount = you have to open this function
double applyDiscountBad(const std::string& type, double price) {
    if (type == "FESTIVE") return price * 0.8;
    else if (type == "PREMIUM") return price * 0.9;
    return price;   // a new type? one more else-if here...
}

// ✅ Good: a new discount = a new class, old code untouched
class Discount {
public:
    virtual ~Discount() = default;
    virtual double apply(double price) const = 0;
};

class FestiveDiscount : public Discount {
public:
    double apply(double price) const override { return price * 0.8; }
};

class PremiumDiscount : public Discount {
public:
    double apply(double price) const override { return price * 0.9; }
};

class BankOfferDiscount : public Discount {   // added later, nothing broke
public:
    double apply(double price) const override { return price - 100; }
};

int main() {
    std::vector<std::unique_ptr<Discount>> offers;
    offers.push_back(std::make_unique<FestiveDiscount>());
    offers.push_back(std::make_unique<PremiumDiscount>());
    offers.push_back(std::make_unique<BankOfferDiscount>());
    for (const auto& d : offers) std::cout << d->apply(1000) << "\n";
}
```

**Where in LLD problems:** `PricingStrategy` in Parking Lot (hourly, flat, weekend), `SplitStrategy` in Splitwise (equal, exact, percent), new channels in Notification (adding WhatsApp).

**Say this in the interview:** "When a new split type comes, I will only write one new `SplitStrategy` class. I will not have to touch the existing tested code."

**Common mistake:**
- Making an interface for everything in the name of OCP, even when the variation will never come.

## ⭐ L – Liskov Substitution

**In one line:** if you put a child class in place of the parent, the program should run with no surprises. A child cannot break the parent's promise.

**Real example:** you said "every Bird flies", then Penguin came along. You passed a Penguin where a Bird was expected and it crashed on `fly()`. That means the hierarchy was wrong.

**When to use / when not:**
- Whenever you feel like writing `throw new UnsupportedOperationException()` or an empty override in a child, stop. LSP is breaking.
- Fix: split the hierarchy by capability (a separate FlyingBird) or use composition.

```java
// ❌ Bad: Penguin breaks Bird's promise (fly)
class BirdBad {
    void fly() { System.out.println("Flying"); }
}

class PenguinBad extends BirdBad {
    @Override
    void fly() { throw new UnsupportedOperationException("Penguin can't fly"); }
}

// ✅ Good: only the promises that everyone can keep
abstract class Bird {
    abstract void eat();
}

abstract class FlyingBird extends Bird {
    abstract void fly();
}

class Sparrow extends FlyingBird {
    void eat() { System.out.println("Sparrow eats seeds"); }
    void fly() { System.out.println("Sparrow flies"); }
}

class Penguin extends Bird {   // never promised to fly
    void eat() { System.out.println("Penguin eats fish"); }
}

public class Main {
    static void letItFly(FlyingBird b) { b.fly(); }   // a Penguin can never get here

    public static void main(String[] args) {
        Bird[] birds = { new Sparrow(), new Penguin() };
        for (Bird b : birds) b.eat();               // both safe
        letItFly(new Sparrow());
        // letItFly(new Penguin());                 // compile error, not a runtime crash
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <vector>

// ❌ Bad: Penguin breaks Bird's promise (fly)
class BirdBad {
public:
    virtual ~BirdBad() = default;
    virtual void fly() { std::cout << "Flying\n"; }
};
class PenguinBad : public BirdBad {
public:
    void fly() override { throw std::logic_error("Penguin can't fly"); }
};

// ✅ Good: only the promises that everyone can keep
class Bird {
public:
    virtual ~Bird() = default;
    virtual void eat() = 0;
};
class FlyingBird : public Bird {
public:
    virtual void fly() = 0;
};
class Sparrow : public FlyingBird {
public:
    void eat() override { std::cout << "Sparrow eats seeds\n"; }
    void fly() override { std::cout << "Sparrow flies\n"; }
};
class Penguin : public Bird {   // never promised to fly
public:
    void eat() override { std::cout << "Penguin eats fish\n"; }
};

void letItFly(FlyingBird& b) { b.fly(); }   // a Penguin can never get here

int main() {
    std::vector<std::unique_ptr<Bird>> birds;
    birds.push_back(std::make_unique<Sparrow>());
    birds.push_back(std::make_unique<Penguin>());
    for (const auto& b : birds) b->eat();   // both safe
    Sparrow s; letItFly(s);                 // passing a Penguin gives a compile error
}
```

**Where in LLD problems:** an `ElectricCar` in Parking Lot that needs a charging spot, `Piece.move()` in Chess where each piece has a different rule but the same contract, `CashOnDelivery` in Payment that does not support `refundToCard()`.

**Say this in the interview:** "If a child has to throw an exception in a method, the hierarchy is wrong. I will move that capability into a separate interface."

**Common mistake:**
- The classic trap: `Square extends Rectangle`. `setWidth()` changes both sides, so code written for Rectangle breaks.

## ⭐ I – Interface Segregation

**In one line:** do not make fat interfaces. Do not force a client to implement methods it does not need.

**Real example:** the old office printer can only print. If the `Machine` interface has print, scan and fax, the old printer has to write fake scan/fax methods.

**When to use / when not:**
- When implementations start showing empty methods or a `throw`.
- Do not make interfaces so small that every method has its own and nobody can follow it. Group them by role.

```java
// ❌ Bad: one fat interface, everyone has to implement everything
interface MachineBad {
    void print();
    void scan();
    void fax();
}

class OldPrinterBad implements MachineBad {
    public void print() { System.out.println("Printing"); }
    public void scan() { throw new UnsupportedOperationException(); }  // forced
    public void fax() { throw new UnsupportedOperationException(); }   // forced
}

// ✅ Good: small, role-based interfaces
interface Printer { void print(); }
interface Scanner { void scan(); }

class OldPrinter implements Printer {
    public void print() { System.out.println("Old printer printing"); }
}

class MultiFunctionPrinter implements Printer, Scanner {
    public void print() { System.out.println("MFP printing"); }
    public void scan() { System.out.println("MFP scanning"); }
}

public class Main {
    static void printDoc(Printer p) { p.print(); }   // only needs print

    public static void main(String[] args) {
        printDoc(new OldPrinter());
        MultiFunctionPrinter mfp = new MultiFunctionPrinter();
        printDoc(mfp);
        mfp.scan();
    }
}
```

```cpp
#include <iostream>
#include <stdexcept>

// ❌ Bad: one fat interface, everyone has to implement everything
class MachineBad {
public:
    virtual ~MachineBad() = default;
    virtual void print() = 0;
    virtual void scan() = 0;
    virtual void fax() = 0;
};
class OldPrinterBad : public MachineBad {
public:
    void print() override { std::cout << "Printing\n"; }
    void scan() override { throw std::logic_error("not supported"); }  // forced
    void fax() override { throw std::logic_error("not supported"); }   // forced
};

// ✅ Good: small, role-based interfaces
class Printer { public: virtual ~Printer() = default; virtual void print() = 0; };
class Scanner { public: virtual ~Scanner() = default; virtual void scan() = 0; };

class OldPrinter : public Printer {
public:
    void print() override { std::cout << "Old printer printing\n"; }
};
class MultiFunctionPrinter : public Printer, public Scanner {
public:
    void print() override { std::cout << "MFP printing\n"; }
    void scan() override { std::cout << "MFP scanning\n"; }
};

void printDoc(Printer& p) { p.print(); }   // only needs print

int main() {
    OldPrinter op;
    printDoc(op);
    MultiFunctionPrinter mfp;
    printDoc(mfp);
    mfp.scan();
}
```

**Where in LLD problems:** separate `Payable` and `Dispensable` in Vending Machine. Separate interfaces for `EntryGate` / `ExitGate` in Parking Lot. `Readable` / `Writable` in a Repository.

**Say this in the interview:** "I will keep interfaces small, by role. Each class implements only the capability it needs."

**Common mistake:**
- Mixing up ISP and LSP. ISP = the size of an interface, LSP = the child behaves like the parent.

## ⭐ D – Dependency Inversion

**In one line:** high-level code (business logic) should not depend on a concrete class, it should depend on an interface. Inject the concrete object from outside.

**Real example:** the OTP service should not care whether the SMS goes through Twilio or MSG91. If the provider changes tomorrow, you only add a new class and the OTP logic stays the same.

**When to use / when not:**
- When the dependency can change (DB, payment provider, SMS vendor) or you need to mock it in tests.
- For pure utilities (Math, String helpers), an interface + injection is overkill.

```java
// ❌ Bad: the high-level class creates the concrete class itself
class SmsSenderBad {
    void send(String msg) { System.out.println("SMS: " + msg); }
}

class OtpServiceBad {
    private final SmsSenderBad sender = new SmsSenderBad();   // tightly coupled
    void sendOtp() { sender.send("OTP 1234"); }
}

// ✅ Good: both depend on an abstraction, the object is injected
interface MessageSender {
    void send(String msg);
}

class SmsSender implements MessageSender {
    public void send(String msg) { System.out.println("SMS: " + msg); }
}

class WhatsAppSender implements MessageSender {
    public void send(String msg) { System.out.println("WhatsApp: " + msg); }
}

class OtpService {
    private final MessageSender sender;
    OtpService(MessageSender sender) { this.sender = sender; }   // constructor injection
    void sendOtp() { sender.send("OTP 1234"); }
}

public class Main {
    public static void main(String[] args) {
        new OtpService(new SmsSender()).sendOtp();
        new OtpService(new WhatsAppSender()).sendOtp();   // zero change in OtpService
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

// ❌ Bad: the high-level class creates the concrete class itself
class SmsSenderBad {
public:
    void send(const std::string& msg) { std::cout << "SMS: " << msg << "\n"; }
};
class OtpServiceBad {
    SmsSenderBad sender;   // tightly coupled
public:
    void sendOtp() { sender.send("OTP 1234"); }
};

// ✅ Good: both depend on an abstraction, the object is injected
class MessageSender {
public:
    virtual ~MessageSender() = default;
    virtual void send(const std::string& msg) = 0;
};
class SmsSender : public MessageSender {
public:
    void send(const std::string& msg) override { std::cout << "SMS: " << msg << "\n"; }
};
class WhatsAppSender : public MessageSender {
public:
    void send(const std::string& msg) override { std::cout << "WhatsApp: " << msg << "\n"; }
};

class OtpService {
    std::unique_ptr<MessageSender> sender;
public:
    explicit OtpService(std::unique_ptr<MessageSender> s) : sender(std::move(s)) {}  // injection
    void sendOtp() { sender->send("OTP 1234"); }
};

int main() {
    OtpService(std::make_unique<SmsSender>()).sendOtp();
    OtpService(std::make_unique<WhatsAppSender>()).sendOtp();   // zero change in OtpService
}
```

**Where in LLD problems:** Notification system (`NotificationService` ← `Channel`), `PaymentProcessor` in Parking Lot, `PaymentGateway` in BookMyShow, `LogSink` in Logger.

**Say this in the interview:** "The service will depend on an interface and the concrete implementation will come through the constructor. That makes both swapping the provider and mocking in unit tests easy."

**Common mistake:**
- Saying DIP (a principle) and DI (Dependency Injection, a technique) are the same. DI is one way to achieve DIP.
- Creating a concrete object with `new` inside the service and then saying "I used an interface".

## DRY, KISS, YAGNI

**In one line:** three small rules. **DRY** = do not write the same logic in two places. **KISS** = keep it simple, not clever. **YAGNI** = do not build now what you do not need now.

**Real example:** in the Swiggy app, phone number validation is copy-pasted in signup, login and profile. When the rule changes (allow +91), you fix it in three places, and if you forget one, you get a bug (DRY). And building a `DroneDeliveryStrategy` now because "maybe drone delivery will come in the future" breaks YAGNI.

**When to use / when not:**
- DRY: if the same **business rule** is in two places, pull it into one function. Do not force-merge code that only looks the same.
- KISS / YAGNI: in the interview, first give a simple working design, then extend it when the interviewer asks.

```java
// ❌ Bad: the same validation in two places (DRY broken)
class SignupBad {
    boolean signup(String phone) { return phone != null && phone.matches("\\d{10}"); }
}
class LoginBad {
    boolean login(String phone) { return phone != null && phone.matches("\\d{10}"); }
}

// ✅ Good: the rule in one place. A simple static helper (KISS), no extra framework (YAGNI)
class PhoneValidator {
    static boolean isValid(String phone) {
        return phone != null && phone.matches("\\d{10}");
    }
}

class Signup {
    boolean signup(String phone) { return PhoneValidator.isValid(phone); }
}

class Login {
    boolean login(String phone) { return PhoneValidator.isValid(phone); }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Signup().signup("9876543210"));  // true
        System.out.println(new Login().login("12345"));         // false
    }
}
```

```cpp
#include <iostream>
#include <regex>
#include <string>

// ❌ Bad: the same validation in two places (DRY broken)
struct SignupBad {
    bool signup(const std::string& p) { return std::regex_match(p, std::regex("\\d{10}")); }
};
struct LoginBad {
    bool login(const std::string& p) { return std::regex_match(p, std::regex("\\d{10}")); }
};

// ✅ Good: the rule in one place. A simple free function (KISS), no extra framework (YAGNI)
bool isValidPhone(const std::string& phone) {
    static const std::regex pattern("\\d{10}");
    return std::regex_match(phone, pattern);
}

struct Signup {
    bool signup(const std::string& p) { return isValidPhone(p); }
};

struct Login {
    bool login(const std::string& p) { return isValidPhone(p); }
};

int main() {
    std::cout << std::boolalpha;
    std::cout << Signup{}.signup("9876543210") << "\n";   // true
    std::cout << Login{}.login("12345") << "\n";          // false
}
```

**Where in LLD problems:** in every problem. Fee calculation in one place in Parking Lot, balance updates through one method in Splitwise. And in a 45-minute round, build only the features that were asked.

**Say this in the interview:** "I will start with a simple design that meets the requirements. I will add extension points only where change is certain."

**Common mistake:**
- Dropping SOLID in the name of YAGNI, or creating 20 interfaces in the name of SOLID. You need balance.

## Checklist

- [ ] I can say all five SOLID principles in one line each without stopping
- [ ] I can explain SRP's "one reason to change" meaning with the Invoice example
- [ ] I can refactor an if-else chain into an interface + classes following OCP
- [ ] I can spot an LSP violation (Penguin / Square-Rectangle) and explain the fix
- [ ] I can tell the difference between ISP and LSP
- [ ] I can tell the difference between DIP and Dependency Injection, and write constructor injection code
- [ ] I can explain DRY, KISS and YAGNI with one example each
