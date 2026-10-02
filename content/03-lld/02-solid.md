---
title: SOLID Principles
order: 2
time: 15
---

# SOLID Principles

SOLID paanch rules hain jo code ko badalne me aasaan banate hain. LLD round me interviewer naya requirement daal ke dekhta hai ki tumhara design toota ya nahi. SOLID follow kiya hai to naya feature = nayi class, purana code safe.

## ⭐ S – Single Responsibility

**Ek line me:** ek class ko badalne ki sirf ek wajah honi chahiye. Ek class, ek kaam.

**Real example:** Zomato ka invoice: total calculate karna, PDF print karna, DB me save karna. Teen alag teams, teen alag reasons to change. Teeno ek class me nahi hone chahiye.

**Kab use karo / kab nahi:**
- Jab class me "aur", "bhi" lagne lage (calculate **aur** print **aur** save), tod do.
- Itna mat todo ki har method ki alag class ban jaye. "Ek reason to change" socho, "ek method" nahi.

```java
// ❌ Bad: ek class, teen reasons to change
class InvoiceBad {
    double amount;
    InvoiceBad(double amount) { this.amount = amount; }
    double total() { return amount * 1.18; }                   // business logic
    void print() { System.out.println("Total: " + total()); }  // presentation
    void saveToDb() { System.out.println("INSERT invoice"); }  // persistence
}

// ✅ Good: har class ka ek kaam
class Invoice {
    private final double amount;
    Invoice(double amount) { this.amount = amount; }
    double total() { return amount * 1.18; }   // sirf GST calculation
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

// ❌ Bad: ek class, teen reasons to change
class InvoiceBad {
    double amount;
public:
    explicit InvoiceBad(double a) : amount(a) {}
    double total() const { return amount * 1.18; }                     // business logic
    void print() const { std::cout << "Total: " << total() << "\n"; }  // presentation
    void saveToDb() const { std::cout << "INSERT invoice\n"; }         // persistence
};

// ✅ Good: har class ka ek kaam
class Invoice {
    double amount;
public:
    explicit Invoice(double a) : amount(a) {}
    double total() const { return amount * 1.18; }   // sirf GST calculation
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

**LLD problems me kahan:** Parking Lot me `ParkingLot` (spots manage), `FeeCalculator` (paisa), `TicketService` (ticket) alag. Splitwise me `ExpenseService` aur `BalanceSheet` alag.

**Interview me bolo:** "Har class ka ek reason to change hai. GST rule badla to sirf `Invoice` badlega, printer ya DB code nahi."

**Common galti:**
- "Single responsibility = ek method" samajhna. Ek class me kai methods ho sakte hain agar sab ek hi responsibility ke hain.

## ⭐ O – Open/Closed

**Ek line me:** class extension ke liye open, modification ke liye closed. Naya behaviour = nayi class, purani class me `if-else` mat jodo.

**Real example:** Flipkart pe har sale me naya discount aata hai (Diwali, Big Billion, Bank offer). Har baar `DiscountCalculator` me naya `else if` jodna risky hai.

**Kab use karo / kab nahi:**
- Jab type pe `switch` / `if-else` chain dikhe aur naye types aate rahenge.
- Sirf 2 fixed cases hain aur kabhi nahi badlenge, to simple `if` theek hai. Pehle din se abstraction mat thopo.

```java
import java.util.List;

// ❌ Bad: naya discount = is method ko kholna padega
class DiscountCalculatorBad {
    double apply(String type, double price) {
        if (type.equals("FESTIVE")) return price * 0.8;
        else if (type.equals("PREMIUM")) return price * 0.9;
        return price;   // naya type? yahan ek aur else-if...
    }
}

// ✅ Good: naya discount = nayi class, purana code untouched
interface Discount {
    double apply(double price);
}

class FestiveDiscount implements Discount {
    public double apply(double price) { return price * 0.8; }
}

class PremiumDiscount implements Discount {
    public double apply(double price) { return price * 0.9; }
}

class BankOfferDiscount implements Discount {   // baad me add kiya, kuch nahi toota
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

// ❌ Bad: naya discount = is function ko kholna padega
double applyDiscountBad(const std::string& type, double price) {
    if (type == "FESTIVE") return price * 0.8;
    else if (type == "PREMIUM") return price * 0.9;
    return price;   // naya type? yahan ek aur else-if...
}

// ✅ Good: naya discount = nayi class, purana code untouched
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

class BankOfferDiscount : public Discount {   // baad me add kiya, kuch nahi toota
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

**LLD problems me kahan:** Parking Lot me `PricingStrategy` (hourly, flat, weekend), Splitwise me `SplitStrategy` (equal, exact, percent), Notification me naye channels (WhatsApp add karna).

**Interview me bolo:** "Naya split type aayega to main sirf ek nayi `SplitStrategy` class likhunga. Existing tested code ko chhedna nahi padega."

**Common galti:**
- OCP ke naam pe har cheez ka interface bana dena, chahe variation kabhi aaye hi nahi.

## ⭐ L – Liskov Substitution

**Ek line me:** child class ko parent ki jagah rakho to program bina surprise ke chalna chahiye. Child parent ka promise nahi tod sakta.

**Real example:** "Har Bird fly karta hai" bol diya, phir Penguin aaya. Penguin ko Bird ki jagah pass kiya aur `fly()` pe crash. Matlab hierarchy galat thi.

**Kab use karo / kab nahi:**
- Jab bhi child me `throw new UnsupportedOperationException()` ya khali override likhne ka mann kare, ruk jao. LSP toot raha hai.
- Fix: hierarchy ko capability ke hisaab se todo (FlyingBird alag) ya composition lo.

```java
// ❌ Bad: Penguin, Bird ka promise (fly) tod raha hai
class BirdBad {
    void fly() { System.out.println("Flying"); }
}

class PenguinBad extends BirdBad {
    @Override
    void fly() { throw new UnsupportedOperationException("Penguin can't fly"); }
}

// ✅ Good: sirf wahi promise jo sab poora kar sakein
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

class Penguin extends Bird {   // fly ka promise hi nahi kiya
    void eat() { System.out.println("Penguin eats fish"); }
}

public class Main {
    static void letItFly(FlyingBird b) { b.fly(); }   // Penguin yahan aa hi nahi sakta

    public static void main(String[] args) {
        Bird[] birds = { new Sparrow(), new Penguin() };
        for (Bird b : birds) b.eat();               // dono safe
        letItFly(new Sparrow());
        // letItFly(new Penguin());                 // compile error, runtime crash nahi
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <stdexcept>
#include <vector>

// ❌ Bad: Penguin, Bird ka promise (fly) tod raha hai
class BirdBad {
public:
    virtual ~BirdBad() = default;
    virtual void fly() { std::cout << "Flying\n"; }
};
class PenguinBad : public BirdBad {
public:
    void fly() override { throw std::logic_error("Penguin can't fly"); }
};

// ✅ Good: sirf wahi promise jo sab poora kar sakein
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
class Penguin : public Bird {   // fly ka promise hi nahi kiya
public:
    void eat() override { std::cout << "Penguin eats fish\n"; }
};

void letItFly(FlyingBird& b) { b.fly(); }   // Penguin yahan aa hi nahi sakta

int main() {
    std::vector<std::unique_ptr<Bird>> birds;
    birds.push_back(std::make_unique<Sparrow>());
    birds.push_back(std::make_unique<Penguin>());
    for (const auto& b : birds) b->eat();   // dono safe
    Sparrow s; letItFly(s);                 // Penguin pass karo to compile error
}
```

**LLD problems me kahan:** Parking Lot me `ElectricCar` jo charging spot maange, Chess me `Piece.move()` jahan har piece ka rule alag par contract same, Payment me `CashOnDelivery` jo `refundToCard()` support nahi karta.

**Interview me bolo:** "Agar child ko method me exception throw karna pad raha hai to hierarchy galat hai. Main capability ko alag interface me nikal dunga."

**Common galti:**
- Classic trap: `Square extends Rectangle`. `setWidth()` dono sides badal deta hai, to Rectangle wala code toot jaata hai.

## ⭐ I – Interface Segregation

**Ek line me:** mota interface mat banao. Client ko woh methods implement karne pe majboor mat karo jo use chahiye hi nahi.

**Real example:** Office ka purana printer sirf print karta hai. Agar `Machine` interface me print, scan, fax teeno hain, to purane printer ko scan/fax ke fake methods likhne padenge.

**Kab use karo / kab nahi:**
- Jab implementations me khali methods ya `throw` dikhne lagein.
- Itne chhote interfaces mat banao ki har method ka alag ho aur koi samjhe hi nahi. Role ke hisaab se group karo.

```java
// ❌ Bad: ek mota interface, sabko sab implement karna padega
interface MachineBad {
    void print();
    void scan();
    void fax();
}

class OldPrinterBad implements MachineBad {
    public void print() { System.out.println("Printing"); }
    public void scan() { throw new UnsupportedOperationException(); }  // majboori
    public void fax() { throw new UnsupportedOperationException(); }   // majboori
}

// ✅ Good: chhote, role-based interfaces
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
    static void printDoc(Printer p) { p.print(); }   // sirf print ki zaroorat

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

// ❌ Bad: ek mota interface, sabko sab implement karna padega
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
    void scan() override { throw std::logic_error("not supported"); }  // majboori
    void fax() override { throw std::logic_error("not supported"); }   // majboori
};

// ✅ Good: chhote, role-based interfaces
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

void printDoc(Printer& p) { p.print(); }   // sirf print ki zaroorat

int main() {
    OldPrinter op;
    printDoc(op);
    MultiFunctionPrinter mfp;
    printDoc(mfp);
    mfp.scan();
}
```

**LLD problems me kahan:** Vending Machine me `Payable`, `Dispensable` alag. Parking Lot me `EntryGate` / `ExitGate` ke alag interfaces. Repository me `Readable` / `Writable`.

**Interview me bolo:** "Interfaces role ke hisaab se chhote rakhunga. Jis class ko jo capability chahiye, wahi implement karegi."

**Common galti:**
- ISP aur LSP mix karna. ISP = interface ka size, LSP = child ka behaviour parent jaisa ho.

## ⭐ D – Dependency Inversion

**Ek line me:** high-level code (business logic) concrete class pe depend na kare, interface pe kare. Concrete object bahar se inject karo.

**Real example:** OTP service ko farak nahi padna chahiye ki SMS Twilio se jaa raha hai ya MSG91 se. Kal provider badla to sirf nayi class, OTP logic same.

**Kab use karo / kab nahi:**
- Jab dependency badal sakti ho (DB, payment provider, SMS vendor) ya test me mock karna ho.
- Pure utility (Math, String helpers) ke liye interface + injection overkill hai.

```java
// ❌ Bad: high-level class khud concrete class bana rahi hai
class SmsSenderBad {
    void send(String msg) { System.out.println("SMS: " + msg); }
}

class OtpServiceBad {
    private final SmsSenderBad sender = new SmsSenderBad();   // tightly coupled
    void sendOtp() { sender.send("OTP 1234"); }
}

// ✅ Good: dono abstraction pe depend karte hain, object inject hota hai
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
        new OtpService(new WhatsAppSender()).sendOtp();   // OtpService me zero change
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

// ❌ Bad: high-level class khud concrete class bana rahi hai
class SmsSenderBad {
public:
    void send(const std::string& msg) { std::cout << "SMS: " << msg << "\n"; }
};
class OtpServiceBad {
    SmsSenderBad sender;   // tightly coupled
public:
    void sendOtp() { sender.send("OTP 1234"); }
};

// ✅ Good: dono abstraction pe depend karte hain, object inject hota hai
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
    OtpService(std::make_unique<WhatsAppSender>()).sendOtp();   // OtpService me zero change
}
```

**LLD problems me kahan:** Notification system (`NotificationService` ← `Channel`), Parking Lot me `PaymentProcessor`, BookMyShow me `PaymentGateway`, Logger me `LogSink`.

**Interview me bolo:** "Service interface pe depend karegi aur concrete implementation constructor se aayegi. Isse provider swap aur unit test me mock dono easy hain."

**Common galti:**
- DIP (principle) aur DI (Dependency Injection, technique) ko same bolna. DI ek tareeka hai DIP achieve karne ka.
- Service ke andar `new` karke concrete object banana aur phir bolna "maine interface use kiya".

## DRY, KISS, YAGNI

**Ek line me:** teen chhote rules. **DRY** = same logic do jagah mat likho. **KISS** = simple rakho, clever nahi. **YAGNI** = jo abhi chahiye nahi, wo abhi mat banao.

**Real example:** Swiggy app me phone number validation signup, login aur profile teeno jagah copy-paste hai. Rule badla (+91 allow karo) to teen jagah fix, ek bhool gaye to bug (DRY). Aur "future me shayad drone delivery aaye" soch ke abhi `DroneDeliveryStrategy` banana YAGNI todna hai.

**Kab use karo / kab nahi:**
- DRY: same **business rule** do jagah ho to ek function me nikalo. Sirf dikhne me same code ko zabardasti merge mat karo.
- KISS / YAGNI: interview me pehle simple working design do, phir interviewer ke kehne pe extend karo.

```java
// ❌ Bad: same validation do jagah (DRY toota)
class SignupBad {
    boolean signup(String phone) { return phone != null && phone.matches("\\d{10}"); }
}
class LoginBad {
    boolean login(String phone) { return phone != null && phone.matches("\\d{10}"); }
}

// ✅ Good: rule ek jagah. Simple static helper (KISS), koi extra framework nahi (YAGNI)
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

// ❌ Bad: same validation do jagah (DRY toota)
struct SignupBad {
    bool signup(const std::string& p) { return std::regex_match(p, std::regex("\\d{10}")); }
};
struct LoginBad {
    bool login(const std::string& p) { return std::regex_match(p, std::regex("\\d{10}")); }
};

// ✅ Good: rule ek jagah. Simple free function (KISS), koi extra framework nahi (YAGNI)
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

**LLD problems me kahan:** har problem me. Parking Lot me fee calculation ek hi jagah, Splitwise me balance update ek hi method se. Aur 45 min ke round me sirf asked features banao.

**Interview me bolo:** "Main pehle simple design se start karunga jo requirements poori kare. Extension points wahi rakhunga jahan change aana pakka hai."

**Common galti:**
- YAGNI ke naam pe SOLID chhod dena, ya SOLID ke naam pe 20 interfaces bana dena. Balance chahiye.

## Checklist

- [ ] Paanchon SOLID principles ek-ek line me bina ruke bol sakta hoon
- [ ] SRP ka "ek reason to change" wala matlab Invoice example se samjha sakta hoon
- [ ] if-else chain ko OCP ke hisaab se interface + classes me refactor karke likh sakta hoon
- [ ] LSP violation pehchaan sakta hoon (Penguin / Square-Rectangle) aur fix bata sakta hoon
- [ ] ISP aur LSP ka farak bata sakta hoon
- [ ] DIP aur Dependency Injection ka farak aur constructor injection ka code likh sakta hoon
- [ ] DRY, KISS, YAGNI ek-ek example se samjha sakta hoon
