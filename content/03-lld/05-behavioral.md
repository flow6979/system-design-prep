---
title: Behavioral Patterns
order: 5
time: 25
---

# Behavioral Patterns

**Ek line me:** objects aapas me kaise baat karein aur kaam kaise baantein, taaki naya behaviour add karne ke liye purana code na todna pade.

## ⭐ Strategy

**Ek line me:** ek kaam ke kai tareeke (algorithms) hon, to har tareeke ko alag class me rakho aur runtime pe swap karo. `if-else` ki lambi chain khatam.

**Real example:** Uber ka fare. Normal time pe normal pricing, baarish me surge pricing, Pool me alag. Ride booking ka code same rehta hai, sirf pricing strategy badalti hai. Payment me bhi yahi: UPI, Card, Wallet.

**Kab use karo / kab nahi:**
- Use karo jab ek hi kaam ke 3+ variants hon aur runtime pe choose karna ho (pricing, payment, sorting, route).
- Use karo jab naya variant aane pe purani class touch nahi karni (Open/Closed).
- Mat karo jab sirf 2 fixed cases hon jo kabhi nahi badlenge. Simple `if` kaafi hai.

```java
public class StrategyDemo {
    interface PricingStrategy {
        double fare(double km);
    }

    static class NormalPricing implements PricingStrategy {
        public double fare(double km) { return 50 + km * 12; }
    }

    static class SurgePricing implements PricingStrategy {
        private final double multiplier;
        SurgePricing(double multiplier) { this.multiplier = multiplier; }
        public double fare(double km) { return (50 + km * 12) * multiplier; }
    }

    static class RideService {
        private PricingStrategy strategy;
        RideService(PricingStrategy strategy) { this.strategy = strategy; }
        void setStrategy(PricingStrategy strategy) { this.strategy = strategy; }
        double book(double km) { return strategy.fare(km); }
    }

    public static void main(String[] args) {
        RideService uber = new RideService(new NormalPricing());
        System.out.println("Normal: " + uber.book(10));  // 170.0
        uber.setStrategy(new SurgePricing(1.5));          // baarish aa gayi
        System.out.println("Surge: " + uber.book(10));   // 255.0
        uber.setStrategy(km -> 30 + km * 8);              // lambda bhi strategy hai
        System.out.println("Pool: " + uber.book(10));    // 110.0
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <utility>

struct PricingStrategy {
    virtual ~PricingStrategy() = default;
    virtual double fare(double km) const = 0;
};

struct NormalPricing : PricingStrategy {
    double fare(double km) const override { return 50 + km * 12; }
};

struct SurgePricing : PricingStrategy {
    double multiplier;
    explicit SurgePricing(double m) : multiplier(m) {}
    double fare(double km) const override { return (50 + km * 12) * multiplier; }
};

class RideService {
    std::unique_ptr<PricingStrategy> strategy;
public:
    explicit RideService(std::unique_ptr<PricingStrategy> s) : strategy(std::move(s)) {}
    void setStrategy(std::unique_ptr<PricingStrategy> s) { strategy = std::move(s); }
    double book(double km) const { return strategy->fare(km); }
};

int main() {
    RideService uber(std::make_unique<NormalPricing>());
    std::cout << "Normal: " << uber.book(10) << "\n";   // 170
    uber.setStrategy(std::make_unique<SurgePricing>(1.5)); // baarish aa gayi
    std::cout << "Surge: " << uber.book(10) << "\n";    // 255
}
```

**LLD problems me kahan:** Parking Lot (hourly vs flat fee), Splitwise (equal / exact / percent split), Elevator (kaunsi lift bhejni hai), Rate limiter (token bucket vs sliding window), Cache (LRU vs LFU eviction).

**Interview me bolo:** "Pricing ke liye main `PricingStrategy` interface rakhunga. Surge, normal, pool alag classes hongi, aur naya pricing model aane pe sirf nayi class add hogi, `RideService` touch nahi hoga."

**Common galti:**
- Strategy ke andar hi `if (type == SURGE)` likh dena. Phir pattern ka fayda hi khatam.
- Strategy aur State ko confuse karna. Strategy client choose karta hai, State object khud badalta hai.

## ⭐ Observer

**Ek line me:** ek object (subject) badle to uske saare subscribers (observers) ko apne aap khabar mile, bina subject ko unke baare me detail me jaane.

**Real example:** Zerodha/Groww me TCS ka price badla, to jinhone alert lagaya hai sabko push jaata hai. YouTube channel subscribe karna bhi yahi hai: video aaya, sab subscribers ko notification.

**Kab use karo / kab nahi:**
- Use karo jab ek event pe kai log react karein (notification, UI update, audit log).
- Use karo jab publisher ko pata na ho ki kitne listeners hain ya kaun hain.
- Mat karo jab order of execution critical ho ya ek hi listener ho. Direct call simple hai.

```java
import java.util.ArrayList;
import java.util.List;

public class ObserverDemo {
    interface StockObserver {
        void update(String symbol, double price);
    }

    static class Stock {
        private final String symbol;
        private double price;
        private final List<StockObserver> observers = new ArrayList<>();

        Stock(String symbol, double price) { this.symbol = symbol; this.price = price; }
        void subscribe(StockObserver o) { observers.add(o); }
        void unsubscribe(StockObserver o) { observers.remove(o); }

        void setPrice(double newPrice) {
            this.price = newPrice;
            for (StockObserver o : observers) o.update(symbol, price);
        }
    }

    static class AppNotifier implements StockObserver {
        private final String user;
        AppNotifier(String user) { this.user = user; }
        public void update(String symbol, double price) {
            System.out.println("Push to " + user + ": " + symbol + " @ " + price);
        }
    }

    public static void main(String[] args) {
        Stock tcs = new Stock("TCS", 3900);
        StockObserver rahul = new AppNotifier("Rahul");
        StockObserver priya = new AppNotifier("Priya");
        tcs.subscribe(rahul);
        tcs.subscribe(priya);
        tcs.setPrice(3950);       // dono ko push
        tcs.unsubscribe(rahul);
        tcs.setPrice(4000);       // sirf Priya ko
    }
}
```

```cpp
#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

struct StockObserver {
    virtual ~StockObserver() = default;
    virtual void update(const std::string& symbol, double price) = 0;
};

class Stock {
    std::string symbol;
    double price;
    std::vector<std::shared_ptr<StockObserver>> observers;
public:
    Stock(std::string s, double p) : symbol(std::move(s)), price(p) {}
    void subscribe(std::shared_ptr<StockObserver> o) { observers.push_back(std::move(o)); }
    void unsubscribe(const std::shared_ptr<StockObserver>& o) {
        observers.erase(std::remove(observers.begin(), observers.end(), o), observers.end());
    }
    void setPrice(double p) {
        price = p;
        for (auto& o : observers) o->update(symbol, price);
    }
};

struct AppNotifier : StockObserver {
    std::string user;
    explicit AppNotifier(std::string u) : user(std::move(u)) {}
    void update(const std::string& s, double p) override {
        std::cout << "Push to " << user << ": " << s << " @ " << p << "\n";
    }
};

int main() {
    Stock tcs("TCS", 3900);
    std::shared_ptr<StockObserver> rahul = std::make_shared<AppNotifier>("Rahul");
    std::shared_ptr<StockObserver> priya = std::make_shared<AppNotifier>("Priya");
    tcs.subscribe(rahul); tcs.subscribe(priya);
    tcs.setPrice(3950);   // dono ko push
    tcs.unsubscribe(rahul);
    tcs.setPrice(4000);   // sirf Priya ko
}
```

**LLD problems me kahan:** Notification service (order placed → SMS, email, push), BookMyShow (seat free hui → waitlist users), Elevator (floor display update), Stock ticker, Auction (new bid → sab bidders).

**Interview me bolo:** "Order status change ek event hai. `OrderService` sirf observers ko notify karega. SMS, email, push alag observers hain, naya channel add karna ho to bas subscribe karo."

**Common galti:**
- Unsubscribe bhool jaana. Observer list me pada rehta hai, memory leak aur dead objects ko call.
- Slow observer ko synchronous call karna. Ek observer atka to sab atke. Real system me queue (Kafka) ke through async karo.

## ⭐ State

**Ek line me:** object ka behaviour uski current state pe depend kare, to har state ko alag class bana do. Har jagah `switch (state)` likhne ki zarurat nahi.

**Real example:** Vending machine. Coin nahi daala to button dabane pe kuch nahi hota, coin daala to item nikalta hai, stock khatam to coin wapas. Swiggy order bhi: Placed → Preparing → Out for delivery → Delivered, aur har state me "cancel" ka matlab alag hai.

**Kab use karo / kab nahi:**
- Use karo jab 3+ states hon aur har action ka result state pe depend kare.
- Use karo jab transitions ke rules clear hon (kis state se kis state me ja sakte ho).
- Mat karo jab sirf 2 states hon (on/off). Ek boolean kaafi hai.

```java
public class StateDemo {
    interface State {
        void insertCoin(VendingMachine vm);
        void selectItem(VendingMachine vm);
    }

    static class IdleState implements State {
        public void insertCoin(VendingMachine vm) {
            System.out.println("Coin mila");
            vm.setState(new HasCoinState());
        }
        public void selectItem(VendingMachine vm) { System.out.println("Pehle coin daalo"); }
    }

    static class HasCoinState implements State {
        public void insertCoin(VendingMachine vm) { System.out.println("Coin pehle se hai"); }
        public void selectItem(VendingMachine vm) {
            System.out.println("Item nikal raha hai...");
            vm.stock--;
            vm.setState(vm.stock > 0 ? new IdleState() : new SoldOutState());
        }
    }

    static class SoldOutState implements State {
        public void insertCoin(VendingMachine vm) { System.out.println("Sold out, coin wapas"); }
        public void selectItem(VendingMachine vm) { System.out.println("Sold out"); }
    }

    static class VendingMachine {
        private State state = new IdleState();
        int stock;
        VendingMachine(int stock) { this.stock = stock; }
        void setState(State s) { this.state = s; }
        void insertCoin() { state.insertCoin(this); }
        void selectItem() { state.selectItem(this); }
    }

    public static void main(String[] args) {
        VendingMachine vm = new VendingMachine(1);
        vm.selectItem();   // Pehle coin daalo
        vm.insertCoin();   // Coin mila
        vm.selectItem();   // Item nikal raha hai... (ab SoldOut)
        vm.insertCoin();   // Sold out, coin wapas
    }
}
```

```cpp
#include <iostream>
class VendingMachine;

struct State {
    virtual ~State() = default;
    virtual void insertCoin(VendingMachine& vm) = 0;
    virtual void selectItem(VendingMachine& vm) = 0;
};
struct IdleState : State {
    void insertCoin(VendingMachine& vm) override;
    void selectItem(VendingMachine&) override { std::cout << "Pehle coin daalo\n"; }
};
struct HasCoinState : State {
    void insertCoin(VendingMachine&) override { std::cout << "Coin pehle se hai\n"; }
    void selectItem(VendingMachine& vm) override;
};
struct SoldOutState : State {
    void insertCoin(VendingMachine&) override { std::cout << "Sold out, coin wapas\n"; }
    void selectItem(VendingMachine&) override { std::cout << "Sold out\n"; }
};

class VendingMachine {
public:
    IdleState idle; HasCoinState hasCoin; SoldOutState soldOut;  // state objects reuse
    State* current = &idle;                                      // non-owning pointer
    int stock;
    explicit VendingMachine(int s) : stock(s) {}
    void insertCoin() { current->insertCoin(*this); }
    void selectItem() { current->selectItem(*this); }
};

void IdleState::insertCoin(VendingMachine& vm) { std::cout << "Coin mila\n"; vm.current = &vm.hasCoin; }
void HasCoinState::selectItem(VendingMachine& vm) {
    std::cout << "Item nikal raha hai...\n";
    vm.current = (--vm.stock > 0) ? static_cast<State*>(&vm.idle) : &vm.soldOut;
}
int main() {
    VendingMachine vm(1);
    vm.selectItem();   // Pehle coin daalo
    vm.insertCoin();   // Coin mila
    vm.selectItem();   // Item nikal raha hai... (ab SoldOut)
    vm.insertCoin();   // Sold out, coin wapas
}
```

**LLD problems me kahan:** Vending Machine (classic), ATM (Idle → CardInserted → PinVerified → Dispensing), Elevator (Idle / MovingUp / MovingDown / DoorOpen), Order status (Swiggy, Amazon), Traffic light, BookMyShow seat (Available → Held → Booked).

**Interview me bolo:** "Vending machine me main State pattern lunga. Har state apne actions khud handle karegi aur next state set karegi, isliye invalid transition (bina coin ke item) code me possible hi nahi."

**Common galti:**
- State classes ke andar business data (stock, balance) rakhna. Data context (machine) me rakho, state sirf behaviour.
- Har state me har method implement karna bhool jaana. Invalid action pe clear error/message do.

## ⭐ Chain of Responsibility

**Ek line me:** request ko handlers ki chain me bhejo. Har handler ya to khud handle kare ya aage pass kare. Sender ko nahi pata kaun handle karega.

**Real example:** Office me leave approval: 2 din tak Team Lead, 5 din tak Manager, usse zyada HR. Web server ka middleware bhi yahi: auth → rate limit → logging → controller. Logger levels: DEBUG console pe, INFO file me, ERROR pe pager.

**Kab use karo / kab nahi:**
- Use karo jab ek request ko kai checks/handlers se guzarna ho aur order configurable ho.
- Use karo jab handler runtime pe add/remove karne hon (middleware).
- Mat karo jab har request ek hi fixed handler pe jaati ho. Chain bas latency aur debugging pain badhayegi.

```java
public class ChainDemo {
    enum Level { DEBUG, INFO, ERROR }

    static abstract class Logger {
        private final Level level;
        private Logger next;
        Logger(Level level) { this.level = level; }

        Logger setNext(Logger next) { this.next = next; return next; }

        void log(Level msgLevel, String msg) {
            if (msgLevel == level) write(msg);
            else if (next != null) next.log(msgLevel, msg);
            else System.out.println("Koi handler nahi: " + msg);
        }
        abstract void write(String msg);
    }

    static class DebugLogger extends Logger {
        DebugLogger() { super(Level.DEBUG); }
        void write(String msg) { System.out.println("[DEBUG] console: " + msg); }
    }

    static class InfoLogger extends Logger {
        InfoLogger() { super(Level.INFO); }
        void write(String msg) { System.out.println("[INFO] file: " + msg); }
    }

    static class ErrorLogger extends Logger {
        ErrorLogger() { super(Level.ERROR); }
        void write(String msg) { System.out.println("[ERROR] pager alert: " + msg); }
    }

    public static void main(String[] args) {
        Logger chain = new DebugLogger();
        chain.setNext(new InfoLogger()).setNext(new ErrorLogger());
        chain.log(Level.INFO, "User login hua");    // InfoLogger handle karega
        chain.log(Level.ERROR, "Payment fail");     // ErrorLogger tak pahunchega
        chain.log(Level.DEBUG, "cache hit");        // pehla hi handle kar lega
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <string>
#include <utility>

enum class Level { Debug, Info, Error };

class Logger {
    Level level;
    std::unique_ptr<Logger> next;
protected:
    virtual void write(const std::string& msg) = 0;
public:
    explicit Logger(Level l) : level(l) {}
    virtual ~Logger() = default;
    Logger& setNext(std::unique_ptr<Logger> n) { next = std::move(n); return *next; }
    void log(Level msgLevel, const std::string& msg) {
        if (msgLevel == level) write(msg);
        else if (next) next->log(msgLevel, msg);
        else std::cout << "Koi handler nahi: " << msg << "\n";
    }
};

struct DebugLogger : Logger {
    DebugLogger() : Logger(Level::Debug) {}
    void write(const std::string& m) override { std::cout << "[DEBUG] console: " << m << "\n"; }
};
struct InfoLogger : Logger {
    InfoLogger() : Logger(Level::Info) {}
    void write(const std::string& m) override { std::cout << "[INFO] file: " << m << "\n"; }
};
struct ErrorLogger : Logger {
    ErrorLogger() : Logger(Level::Error) {}
    void write(const std::string& m) override { std::cout << "[ERROR] pager alert: " << m << "\n"; }
};

int main() {
    auto chain = std::make_unique<DebugLogger>();
    chain->setNext(std::make_unique<InfoLogger>()).setNext(std::make_unique<ErrorLogger>());
    chain->log(Level::Info, "User login hua");   // InfoLogger handle karega
    chain->log(Level::Error, "Payment fail");    // ErrorLogger tak pahunchega
    chain->log(Level::Debug, "cache hit");       // pehla hi handle kar lega
}
```

**LLD problems me kahan:** Logger (levels), ATM cash dispenser (2000 → 500 → 100 ke notes), Leave/expense approval, API middleware (auth, rate limiter, validation), Vending machine change return.

**Interview me bolo:** "ATM me cash dispense ke liye main chain lunga: 2000 ka handler jitne note de sakta hai de, baaki 500 wale ko pass kare, phir 100. Naya denomination aaye to bas chain me ek link jodna hai."

**Common galti:**
- Chain ke end pe koi default handler na hona. Request chupchaap gum ho jaati hai.
- Handlers ka order galat rakhna (logging auth se pehle, ya rate limit validation ke baad).

## ⭐ Command

**Ek line me:** ek action (request) ko object bana do. Phir use queue me daal sakte ho, log kar sakte ho, aur sabse important, undo kar sakte ho.

**Real example:** Text editor ka Ctrl+Z. Har typing ek command object hai jo stack me jaata hai, undo pe ulta chalta hai. TV remote bhi: har button ek command, remote ko nahi pata TV andar kya karta hai.

**Kab use karo / kab nahi:**
- Use karo jab undo/redo chahiye (editor, drawing app, game moves).
- Use karo jab actions ko queue, schedule ya retry karna ho (job queue, macro, transaction log).
- Mat karo simple CRUD ke liye jahan na undo hai na queue. Bas extra classes ban jaayengi.

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class CommandDemo {
    interface Command {
        void execute();
        void undo();
    }

    static class Editor {
        final StringBuilder text = new StringBuilder();
    }

    static class TypeCommand implements Command {
        private final Editor editor;
        private final String word;
        TypeCommand(Editor editor, String word) { this.editor = editor; this.word = word; }
        public void execute() { editor.text.append(word); }
        public void undo() { editor.text.setLength(editor.text.length() - word.length()); }
    }

    static class CommandManager {
        private final Deque<Command> history = new ArrayDeque<>();
        void run(Command c) { c.execute(); history.push(c); }
        void undo() { if (!history.isEmpty()) history.pop().undo(); }
    }

    public static void main(String[] args) {
        Editor ed = new Editor();
        CommandManager mgr = new CommandManager();
        mgr.run(new TypeCommand(ed, "Hello "));
        mgr.run(new TypeCommand(ed, "World"));
        System.out.println(ed.text);   // Hello World
        mgr.undo();
        System.out.println(ed.text);   // Hello
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <stack>
#include <string>
#include <utility>

struct Editor { std::string text; };

struct Command {
    virtual ~Command() = default;
    virtual void execute() = 0;
    virtual void undo() = 0;
};

class TypeCommand : public Command {
    Editor& editor;
    std::string word;
public:
    TypeCommand(Editor& e, std::string w) : editor(e), word(std::move(w)) {}
    void execute() override { editor.text += word; }
    void undo() override { editor.text.erase(editor.text.size() - word.size()); }
};

class CommandManager {
    std::stack<std::unique_ptr<Command>> history;
public:
    void run(std::unique_ptr<Command> c) { c->execute(); history.push(std::move(c)); }
    void undo() {
        if (history.empty()) return;
        history.top()->undo();
        history.pop();
    }
};

int main() {
    Editor ed;
    CommandManager mgr;
    mgr.run(std::make_unique<TypeCommand>(ed, "Hello "));
    mgr.run(std::make_unique<TypeCommand>(ed, "World"));
    std::cout << ed.text << "\n";   // Hello World
    mgr.undo();
    std::cout << ed.text << "\n";   // Hello
}
```

**LLD problems me kahan:** Text editor (undo/redo), Chess (move history, undo move), Elevator (floor requests ko command bana ke queue), Smart home remote, Job scheduler / task queue.

**Interview me bolo:** "Har move ek `Command` object hai jisme `execute` aur `undo` dono hain. History stack me rakhenge, undo pe pop karke `undo()` call. Redo ke liye doosra stack."

**Common galti:**
- Undo ke liye zaroori purana data command me save na karna (jaise delete kiya hua text).
- Naya command run karne pe redo stack clear na karna. Galat redo ho jaata hai.

## Template Method

**Ek line me:** algorithm ke steps ka order base class fix karti hai, aur kuch steps subclasses apne hisaab se bharti hain.

**Real example:** Payment flow hamesha validate → debit → receipt hi hai. UPI aur Card me sirf "debit" ka tareeka alag hai, aur Card me OTP step extra.

**Kab use karo / kab nahi:**
- Use karo jab kai classes ka flow same ho, sirf beech ke kuch steps alag hon.
- Use karo jab steps ka order enforce karna ho (koi subclass validate skip na kar paaye).
- Mat karo jab variations bahut zyada hon. Tab Strategy (composition) better hai, inheritance tight coupling deta hai.

```java
public class TemplateDemo {
    static abstract class PaymentFlow {
        // template method: final, taaki subclass order na badal sake
        public final void process(double amount) {
            validate(amount);
            debit(amount);
            if (needsOtp()) System.out.println("OTP verify kiya");
            System.out.println("Receipt bheji: Rs " + amount);
        }

        private void validate(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Invalid amount");
        }

        protected abstract void debit(double amount);    // har subclass alag
        protected boolean needsOtp() { return false; }   // hook, default false
    }

    static class UpiPayment extends PaymentFlow {
        protected void debit(double amount) { System.out.println("UPI collect request: Rs " + amount); }
    }

    static class CardPayment extends PaymentFlow {
        protected void debit(double amount) { System.out.println("Card charge kiya: Rs " + amount); }
        @Override protected boolean needsOtp() { return true; }
    }

    public static void main(String[] args) {
        new UpiPayment().process(250);
        new CardPayment().process(1200);
    }
}
```

```cpp
#include <iostream>
#include <stdexcept>

class PaymentFlow {
public:
    virtual ~PaymentFlow() = default;
    // template method: non-virtual, taaki subclass order na badal sake
    void process(double amount) {
        validate(amount);
        debit(amount);
        if (needsOtp()) std::cout << "OTP verify kiya\n";
        std::cout << "Receipt bheji: Rs " << amount << "\n";
    }
protected:
    virtual void debit(double amount) = 0;       // har subclass alag
    virtual bool needsOtp() const { return false; } // hook, default false
private:
    void validate(double amount) {
        if (amount <= 0) throw std::invalid_argument("Invalid amount");
    }
};

class UpiPayment : public PaymentFlow {
protected:
    void debit(double amount) override { std::cout << "UPI collect request: Rs " << amount << "\n"; }
};

class CardPayment : public PaymentFlow {
protected:
    void debit(double amount) override { std::cout << "Card charge kiya: Rs " << amount << "\n"; }
    bool needsOtp() const override { return true; }
};

int main() {
    UpiPayment upi;
    CardPayment card;
    upi.process(250);
    card.process(1200);
}
```

**LLD problems me kahan:** Game flow (Chess, Snake & Ladder: `initBoard → while(!over) playTurn → declareWinner`), Payment processing, Report/CSV export, Notification (build → send → log).

**Interview me bolo:** "Saare games ka skeleton same hai, isliye `Game.play()` template method hai. Snake & Ladder aur Chess sirf `makeMove()` aur `isOver()` override karenge."

**Common galti:**
- Template method ko `final` (Java) / non-virtual (C++) na rakhna. Subclass poora flow hi override kar deti hai.
- Har chhoti variation ke liye nayi subclass. Class explosion. Tab Strategy lo.

## Iterator

**Ek line me:** collection ke andar ka structure (array, tree, linked list) chhupa ke ek-ek element traverse karne ka common tareeka do.

**Real example:** Spotify playlist pe "next" dabate raho. Tumhe nahi pata songs array me hain ya linked list me. Instagram feed ka infinite scroll bhi ek tarah ka iterator (cursor) hai.

**Kab use karo / kab nahi:**
- Use karo jab custom collection banao (board cells, tree, paginated API) aur client ko for-each chahiye.
- Use karo jab ek collection ke kai traversal hon (forward, reverse, shuffle).
- Mat banao khud ka jab `List`/`vector` direct expose karna theek hai. Language ka built-in iterator kaafi hai.

```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

public class IteratorDemo {
    static class Playlist implements Iterable<String> {
        private final List<String> songs = new ArrayList<>();   // andar ka structure hidden
        void add(String song) { songs.add(song); }

        @Override
        public Iterator<String> iterator() {
            return new Iterator<>() {
                private int index = 0;
                public boolean hasNext() { return index < songs.size(); }
                public String next() {
                    if (!hasNext()) throw new NoSuchElementException();
                    return songs.get(index++);
                }
            };
        }
    }

    public static void main(String[] args) {
        Playlist p = new Playlist();
        p.add("Kesariya");
        p.add("Tum Hi Ho");
        p.add("Apna Bana Le");
        for (String song : p) System.out.println("Playing: " + song);  // for-each iterator() use karta hai
    }
}
```

```cpp
#include <cstddef>
#include <iostream>
#include <string>
#include <utility>
#include <vector>

class Playlist {
    std::vector<std::string> songs;   // andar ka structure hidden
public:
    class Iterator {
        const Playlist* list;
        std::size_t index;
    public:
        Iterator(const Playlist* l, std::size_t i) : list(l), index(i) {}
        const std::string& operator*() const { return list->songs[index]; }
        Iterator& operator++() { ++index; return *this; }
        bool operator!=(const Iterator& other) const { return index != other.index; }
    };

    void add(std::string s) { songs.push_back(std::move(s)); }
    Iterator begin() const { return Iterator(this, 0); }
    Iterator end() const { return Iterator(this, songs.size()); }
};

int main() {
    Playlist p;
    p.add("Kesariya");
    p.add("Tum Hi Ho");
    p.add("Apna Bana Le");
    for (const auto& song : p) std::cout << "Playing: " << song << "\n";  // begin()/end() use hota hai
}
```

**LLD problems me kahan:** Chess / Snake & Ladder (board cells traverse), File system (directory tree), Paginated results (cursor-based API), Social feed.

**Interview me bolo:** "Board ko main `Iterable` banaunga taaki client `for (Cell c : board)` likhe aur use 2D array ya map ka pata na ho."

**Common galti:**
- Iterate karte waqt collection modify karna (Java me `ConcurrentModificationException`, C++ me invalid iterator).
- Internal list hi return kar dena (`getSongs()`). Encapsulation khatam, bahar se koi bhi modify kar dega.

## Mediator

**Ek line me:** jab bahut saare objects ek doosre se directly baat karein to mess ban jaata hai. Beech me ek mediator rakho, sab sirf usse baat karein.

**Real example:** WhatsApp group. Mummy har member ko alag message nahi bhejti, group me bhejti hai aur group sabko deliver karta hai. Airport ka ATC tower bhi: planes aapas me nahi, tower se baat karte hain.

**Kab use karo / kab nahi:**
- Use karo jab N objects ke beech N×N connections ban rahe hon (chat room, UI form fields, ATC).
- Use karo jab interaction ka logic ek jagah centralize karna ho.
- Mat karo jab sirf 2–3 objects hon. Mediator khud "God object" ban sakta hai.

```java
import java.util.ArrayList;
import java.util.List;

public class MediatorDemo {
    interface ChatMediator {
        void join(User u);
        void send(String msg, User from);
    }

    static class GroupChat implements ChatMediator {
        private final List<User> users = new ArrayList<>();
        public void join(User u) { users.add(u); }
        public void send(String msg, User from) {
            for (User u : users)
                if (u != from) u.receive(msg, from.name);
        }
    }

    static class User {
        final String name;
        private final ChatMediator group;
        User(String name, ChatMediator group) { this.name = name; this.group = group; }
        void send(String msg) { group.send(msg, this); }
        void receive(String msg, String from) { System.out.println(name + " ko " + from + " se: " + msg); }
    }

    public static void main(String[] args) {
        ChatMediator family = new GroupChat();
        User mummy = new User("Mummy", family);
        User rahul = new User("Rahul", family);
        User priya = new User("Priya", family);
        family.join(mummy);
        family.join(rahul);
        family.join(priya);
        mummy.send("Khana ready hai");   // Rahul aur Priya ko milega
        rahul.send("5 min me aaya");     // Mummy aur Priya ko milega
    }
}
```

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>

class User;

class GroupChat {
    std::vector<User*> users;   // non-owning, users main() ke paas hain
public:
    void join(User* u) { users.push_back(u); }
    void send(const std::string& msg, const User* from);
};

class User {
    GroupChat& group;
public:
    const std::string name;
    User(std::string n, GroupChat& g) : group(g), name(std::move(n)) {}
    void send(const std::string& msg) { group.send(msg, this); }
    void receive(const std::string& msg, const std::string& from) const {
        std::cout << name << " ko " << from << " se: " << msg << "\n";
    }
};

void GroupChat::send(const std::string& msg, const User* from) {
    for (User* u : users)
        if (u != from) u->receive(msg, from->name);
}

int main() {
    GroupChat family;
    User mummy("Mummy", family), rahul("Rahul", family), priya("Priya", family);
    family.join(&mummy);
    family.join(&rahul);
    family.join(&priya);
    mummy.send("Khana ready hai");   // Rahul aur Priya ko milega
    rahul.send("5 min me aaya");     // Mummy aur Priya ko milega
}
```

**LLD problems me kahan:** Elevator (ElevatorController decide karta hai kaunsi lift jaayegi, lifts aapas me baat nahi karti), Chat room, Splitwise (ExpenseManager users ke beech balance manage karta hai), Auction house, Chess game controller.

**Interview me bolo:** "Lifts ek doosre ko nahi jaanti. `ElevatorController` mediator hai jo saari requests leta hai aur best lift assign karta hai."

**Common galti:**
- Mediator me saara business logic thoos dena. Woh God class ban jaata hai, use coordinate tak limit rakho.
- Mediator aur Observer confuse karna. Observer one-to-many broadcast hai, Mediator many-to-many coordination.

## Memento

**Ek line me:** object ki state ka snapshot save karo aur baad me wahi state wapas laao, bina uske private fields bahar expose kiye.

**Real example:** Game me checkpoint save. Mar gaye to last checkpoint se shuru. Google Docs ki version history bhi yahi: purana version restore.

**Kab use karo / kab nahi:**
- Use karo jab undo/rollback ke liye poori state wapas chahiye (editor, game save, form draft).
- Use karo jab state ko bahar save karna ho par encapsulation todna nahi.
- Mat karo jab state bahut badi ho aur snapshot baar baar lena pade. Memory phat jaayegi, tab Command (sirf diff) better.

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class MementoDemo {
    // Memento: immutable snapshot
    record EditorSnapshot(String text, int cursor) {}

    // Originator: apni state ka snapshot banata aur restore karta hai
    static class Editor {
        private String text = "";
        private int cursor = 0;
        void type(String s) { text += s; cursor = text.length(); }
        EditorSnapshot save() { return new EditorSnapshot(text, cursor); }
        void restore(EditorSnapshot s) { text = s.text(); cursor = s.cursor(); }
        @Override public String toString() { return text + " (cursor " + cursor + ")"; }
    }

    // Caretaker: snapshots sambhalta hai, andar nahi jhaankta
    static class History {
        private final Deque<EditorSnapshot> stack = new ArrayDeque<>();
        void push(EditorSnapshot s) { stack.push(s); }
        EditorSnapshot pop() { return stack.pop(); }
    }

    public static void main(String[] args) {
        Editor ed = new Editor();
        History history = new History();
        ed.type("Hello");
        history.push(ed.save());       // checkpoint
        ed.type(" World");
        System.out.println(ed);        // Hello World (cursor 11)
        ed.restore(history.pop());
        System.out.println(ed);        // Hello (cursor 5)
    }
}
```

```cpp
#include <cstddef>
#include <iostream>
#include <stack>
#include <string>
#include <utility>

// Originator: apni state ka snapshot banata aur restore karta hai
class Editor {
    std::string text;
    std::size_t cursor = 0;
public:
    class Snapshot {               // Memento: andar sirf Editor dekh sakta hai
        friend class Editor;
        std::string text;
        std::size_t cursor;
        Snapshot(std::string t, std::size_t c) : text(std::move(t)), cursor(c) {}
    };
    void type(const std::string& s) { text += s; cursor = text.size(); }
    Snapshot save() const { return Snapshot(text, cursor); }
    void restore(const Snapshot& s) { text = s.text; cursor = s.cursor; }
    void print() const { std::cout << text << " (cursor " << cursor << ")\n"; }
};

int main() {
    Editor ed;
    std::stack<Editor::Snapshot> history;   // Caretaker
    ed.type("Hello");
    history.push(ed.save());       // checkpoint
    ed.type(" World");
    ed.print();                    // Hello World (cursor 11)
    ed.restore(history.top());
    history.pop();
    ed.print();                    // Hello (cursor 5)
}
```

**LLD problems me kahan:** Text editor (undo), Chess / Snake & Ladder (game save, undo move), Vending machine / ATM (transaction fail pe rollback), Form draft save.

**Interview me bolo:** "Undo ke liye do option hain: Command jo sirf change ka ulta karta hai, ya Memento jo poora snapshot rakhta hai. State chhoti hai to Memento simple hai, badi hai to Command."

**Common galti:**
- Memento ko mutable rakhna ya uske fields public kar dena. Koi bhi snapshot badal dega.
- Unlimited snapshots rakhna. History ki limit rakho (last 50).

## Visitor

**Ek line me:** objects ki classes ko chhede bina unpe naye operations add karo. Har operation ek visitor class hai jo har type ke liye alag `visit` method rakhta hai.

**Real example:** Flipkart cart me Book aur Mobile hain. GST calculate karna, shipping nikalna, invoice banana: ye sab alag operations hain. Har baar Item class me naya method daalne ke bajaye har operation ka ek visitor bana do.

**Kab use karo / kab nahi:**
- Use karo jab classes (types) stable hon par naye operations baar baar aate hon (tax, export, report).
- Use karo jab ek object tree (Composite) pe kai alag operations chalane hon (file size, search, compiler AST).
- Mat karo jab naye types baar baar add hote hon. Har naye type pe saare visitors badalne padenge.

```java
import java.util.List;

public class VisitorDemo {
    interface ItemVisitor {
        double visit(Book b);
        double visit(Mobile m);
    }

    interface Item {
        double accept(ItemVisitor v);   // double dispatch yahin hota hai
    }

    record Book(double price) implements Item {
        public double accept(ItemVisitor v) { return v.visit(this); }
    }

    record Mobile(double price, double weightKg) implements Item {
        public double accept(ItemVisitor v) { return v.visit(this); }
    }

    static class GstVisitor implements ItemVisitor {
        public double visit(Book b) { return b.price() * 0.05; }
        public double visit(Mobile m) { return m.price() * 0.18; }
    }

    static class ShippingVisitor implements ItemVisitor {
        public double visit(Book b) { return 40; }
        public double visit(Mobile m) { return 50 + m.weightKg() * 20; }
    }

    public static void main(String[] args) {
        List<Item> cart = List.of(new Book(500), new Mobile(20000, 0.2));
        ItemVisitor gst = new GstVisitor();
        ItemVisitor ship = new ShippingVisitor();
        double totalGst = 0, totalShip = 0;
        for (Item it : cart) {
            totalGst += it.accept(gst);
            totalShip += it.accept(ship);
        }
        System.out.println("GST: " + totalGst + ", Shipping: " + totalShip);  // GST: 3625.0, Shipping: 94.0
    }
}
```

```cpp
#include <iostream>
#include <memory>
#include <vector>
struct Book; struct Mobile;
struct ItemVisitor {
    virtual ~ItemVisitor() = default;
    virtual double visit(const Book& b) = 0;
    virtual double visit(const Mobile& m) = 0;
};
struct Item {
    virtual ~Item() = default;
    virtual double accept(ItemVisitor& v) const = 0;   // double dispatch yahin hota hai
};

struct Book : Item {
    double price;
    explicit Book(double p) : price(p) {}
    double accept(ItemVisitor& v) const override { return v.visit(*this); }
};
struct Mobile : Item {
    double price, weightKg;
    Mobile(double p, double w) : price(p), weightKg(w) {}
    double accept(ItemVisitor& v) const override { return v.visit(*this); }
};

struct GstVisitor : ItemVisitor {
    double visit(const Book& b) override { return b.price * 0.05; }
    double visit(const Mobile& m) override { return m.price * 0.18; }
};
struct ShippingVisitor : ItemVisitor {
    double visit(const Book&) override { return 40; }
    double visit(const Mobile& m) override { return 50 + m.weightKg * 20; }
};
int main() {
    std::vector<std::unique_ptr<Item>> cart;
    cart.push_back(std::make_unique<Book>(500));
    cart.push_back(std::make_unique<Mobile>(20000, 0.2));
    GstVisitor gst; ShippingVisitor ship;
    double totalGst = 0, totalShip = 0;
    for (const auto& it : cart) {
        totalGst += it->accept(gst);
        totalShip += it->accept(ship);
    }
    std::cout << "GST: " << totalGst << ", Shipping: " << totalShip << "\n";  // GST: 3625, Shipping: 94
}
```

**LLD problems me kahan:** Shopping cart (tax, discount, shipping), File system (size calculate, search, Composite ke saath), Parking Lot (vehicle type ke hisaab se fee report), Compiler / expression evaluator.

**Interview me bolo:** "Item types fixed hain par operations badhte rahenge, isliye Visitor lunga. Naya operation, jaise invoice, bas ek nayi visitor class hai, `Book`/`Mobile` touch nahi honge."

**Common galti:**
- Types frequently badalne wale domain me Visitor lagana. Har naye type pe har visitor edit.
- Visitor ke andar `instanceof` / `dynamic_cast` likhna. Double dispatch ka poora point hi yahi hai ki type check na karna pade.

## ⭐ Pattern kaise chunein

Interview me pehle problem/smell pehchano, phir pattern ka naam lo. Pattern pehle chuno aur problem baad me fit karo, ye ulta hai.

### Problem / smell → pattern

| Problem ya code smell | Pattern | Type |
|---|---|---|
| Poore app me ek hi instance chahiye (config, logger, DB pool) | Singleton | Creational |
| `new` ke saath `if-else` ki chain: type ke hisaab se object banana | Factory | Creational |
| Constructor me 6+ params, kai optional | Builder | Creational |
| Related objects ki poori family ek saath badalni hai (Light/Dark UI, AWS/GCP) | Abstract Factory | Creational |
| Object banana mehenga hai, existing ko copy karke kaam chal jaayega | Prototype | Creational |
| Third-party/legacy API ka interface hamare interface se match nahi karta | Adapter | Structural |
| Runtime pe features jodne hain (toppings, logging, compression) bina subclass explosion | Decorator | Structural |
| Complex subsystem ke liye ek simple entry point chahiye | Facade | Structural |
| Access control, lazy loading, caching ya remote call beech me chahiye | Proxy | Structural |
| Tree structure jahan leaf aur group ko same treat karna hai (folder/file) | Composite | Structural |
| Do dimensions independently badhte hain (Shape × Color, Remote × Device) | Bridge | Structural |
| Lakhon chhote similar objects, memory bachani hai (chess pieces, map trees) | Flyweight | Structural |
| Ek kaam ke kai algorithms, runtime pe swap (`if type == ...` chain) | Strategy | Behavioral |
| Ek event pe kai log react karein (notifications, UI refresh) | Observer | Behavioral |
| Behaviour current status pe depend karta hai, har jagah `switch(state)` | State | Behavioral |
| Request kai handlers/checks se guzare, order configurable (middleware, approval) | Chain of Responsibility | Behavioral |
| Undo/redo, ya actions ko queue/log/retry karna hai | Command | Behavioral |
| Flow same, sirf kuch steps alag (game loop, payment flow) | Template Method | Behavioral |
| Custom collection ko bina internals dikhaye traverse karna | Iterator | Behavioral |
| Bahut saare objects aapas me tangle ho rahe hain (N×N calls) | Mediator | Behavioral |
| State ka snapshot save/restore bina encapsulation tode | Memento | Behavioral |
| Types fixed, par un pe naye operations baar baar add hote hain | Visitor | Behavioral |

### LLD question → patterns

| LLD question | Patterns | Kahan lagta hai |
|---|---|---|
| Parking Lot | Singleton, Factory, Strategy, Observer | ParkingLot ek instance, vehicle/spot Factory, fee Strategy (hourly/flat), display board Observer |
| Elevator | State, Strategy, Mediator, Command | Lift State (Idle/Up/Down), scheduling Strategy, Controller Mediator, requests as Command |
| Vending Machine | State, Chain of Responsibility, Singleton | Idle/HasCoin/Dispensing/SoldOut State, change return Chain |
| Splitwise | Strategy, Factory, Observer, Mediator | Equal/Exact/Percent split Strategy, ExpenseFactory, balance update Observer |
| BookMyShow | Singleton, Factory, Strategy, Observer, State | Payment Strategy, seat State (Available/Held/Booked), seat free pe waitlist Observer |
| Logger | Singleton, Chain of Responsibility, Strategy, Observer | Level-wise Chain, output Strategy (console/file), multiple sinks Observer |
| Chess | Factory, Command, Memento, Strategy, Flyweight | Piece Factory, move Command (undo), game save Memento, piece movement Strategy |
| Snake & Ladder | Factory, Template Method, Strategy, Iterator | Board Factory, game loop Template, dice Strategy (normal/crooked), players turn Iterator |
| Notification service | Observer, Strategy, Factory, Decorator, Template Method | Event → Observer, channel Strategy (SMS/email/push), retry/logging Decorator |
| Rate limiter | Strategy, Factory, Singleton, Proxy, Chain of Responsibility | Token bucket / sliding window Strategy, limiter Proxy ya middleware Chain |
| Cache LRU | Strategy, Proxy, Decorator, Singleton | Eviction Strategy (LRU/LFU), caching Proxy service ke aage |
| ATM | State, Chain of Responsibility, Facade, Singleton | Card/PIN/Dispense State, note dispenser Chain (2000→500→100), bank ops Facade |

## Checklist

- [ ] Strategy aur State ka difference ek line me bata sakta hoon (kaun switch karta hai: client ya object khud).
- [ ] Observer ka code bina dekhe likh sakta hoon, aur unsubscribe/async ka issue bata sakta hoon.
- [ ] Vending Machine ya ATM ka State diagram aur classes 5 min me bana sakta hoon.
- [ ] Chain of Responsibility se ATM note dispenser ya middleware explain kar sakta hoon.
- [ ] Command se undo/redo implement kar sakta hoon aur Command vs Memento compare kar sakta hoon.
- [ ] Template Method, Iterator, Mediator, Visitor ka ek-ek real use case bata sakta hoon.
- [ ] Kisi bhi code smell ko dekh ke sahi pattern ka naam le sakta hoon (Pattern kaise chunein table).
- [ ] Parking Lot, Elevator, Splitwise, BookMyShow me kaunse patterns lagenge ye turant bata sakta hoon.
