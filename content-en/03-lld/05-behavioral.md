---
title: Behavioral Patterns
order: 5
time: 25
---

# Behavioral Patterns

**In one line:** how objects talk to each other and share work, so you don't have to break old code to add new behaviour.

## ⭐ Strategy

**In one line:** when one task has many ways (algorithms) to do it, put each way in its own class and swap it at runtime. No more long `if-else` chains.

**Real example:** Uber fares. Normal pricing at normal times, surge pricing when it rains, different pricing for Pool. The ride booking code stays the same, only the pricing strategy changes. Same for payment: UPI, Card, Wallet.

**When to use / when not:**
- Use it when one task has 3+ variants and you choose one at runtime (pricing, payment, sorting, route).
- Use it when a new variant should not require touching old classes (Open/Closed).
- Don't use it when there are only 2 fixed cases that will never change. A simple `if` is enough.

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
        uber.setStrategy(new SurgePricing(1.5));          // it started raining
        System.out.println("Surge: " + uber.book(10));   // 255.0
        uber.setStrategy(km -> 30 + km * 8);              // a lambda is also a strategy
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
    uber.setStrategy(std::make_unique<SurgePricing>(1.5)); // it started raining
    std::cout << "Surge: " << uber.book(10) << "\n";    // 255
}
```

**Where in LLD problems:** Parking Lot (hourly vs flat fee), Splitwise (equal / exact / percent split), Elevator (which lift to send), Rate limiter (token bucket vs sliding window), Cache (LRU vs LFU eviction).

**Say this in the interview:** "For pricing I will keep a `PricingStrategy` interface. Surge, normal and pool will be separate classes, and a new pricing model only means adding a new class. `RideService` will not be touched."

**Common mistake:**
- Writing `if (type == SURGE)` inside the strategy itself. Then the whole benefit of the pattern is gone.
- Confusing Strategy and State. In Strategy the client chooses, in State the object changes itself.

## ⭐ Observer

**In one line:** when one object (subject) changes, all its subscribers (observers) get informed automatically, and the subject does not need to know details about them.

**Real example:** On Zerodha/Groww, when the TCS price changes, everyone who set an alert gets a push. Subscribing to a YouTube channel is the same: a new video comes, all subscribers get a notification.

**When to use / when not:**
- Use it when many parts react to one event (notification, UI update, audit log).
- Use it when the publisher does not know how many listeners there are or who they are.
- Don't use it when the order of execution is critical or there is only one listener. A direct call is simpler.

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
        tcs.setPrice(3950);       // push to both
        tcs.unsubscribe(rahul);
        tcs.setPrice(4000);       // only to Priya
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
    tcs.setPrice(3950);   // push to both
    tcs.unsubscribe(rahul);
    tcs.setPrice(4000);   // only to Priya
}
```

**Where in LLD problems:** Notification service (order placed → SMS, email, push), BookMyShow (seat becomes free → waitlist users), Elevator (floor display update), Stock ticker, Auction (new bid → all bidders).

**Say this in the interview:** "An order status change is an event. `OrderService` will only notify observers. SMS, email and push are separate observers, and to add a new channel you just subscribe it."

**Common mistake:**
- Forgetting to unsubscribe. The observer stays in the list, causing a memory leak and calls to dead objects.
- Calling a slow observer synchronously. If one observer gets stuck, everything gets stuck. In a real system, make it async through a queue (Kafka).

## ⭐ State

**In one line:** when an object's behaviour depends on its current state, make each state a separate class. No need to write `switch (state)` everywhere.

**Real example:** A vending machine. With no coin, pressing the button does nothing. With a coin, the item comes out. When stock is over, the coin comes back. A Swiggy order too: Placed → Preparing → Out for delivery → Delivered, and "cancel" means something different in each state.

**When to use / when not:**
- Use it when there are 3+ states and the result of each action depends on the state.
- Use it when the transition rules are clear (which state can go to which state).
- Don't use it when there are only 2 states (on/off). A boolean is enough.

```java
public class StateDemo {
    interface State {
        void insertCoin(VendingMachine vm);
        void selectItem(VendingMachine vm);
    }

    static class IdleState implements State {
        public void insertCoin(VendingMachine vm) {
            System.out.println("Coin received");
            vm.setState(new HasCoinState());
        }
        public void selectItem(VendingMachine vm) { System.out.println("Insert a coin first"); }
    }

    static class HasCoinState implements State {
        public void insertCoin(VendingMachine vm) { System.out.println("Coin already inserted"); }
        public void selectItem(VendingMachine vm) {
            System.out.println("Dispensing item...");
            vm.stock--;
            vm.setState(vm.stock > 0 ? new IdleState() : new SoldOutState());
        }
    }

    static class SoldOutState implements State {
        public void insertCoin(VendingMachine vm) { System.out.println("Sold out, coin returned"); }
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
        vm.selectItem();   // Insert a coin first
        vm.insertCoin();   // Coin received
        vm.selectItem();   // Dispensing item... (now SoldOut)
        vm.insertCoin();   // Sold out, coin returned
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
    void selectItem(VendingMachine&) override { std::cout << "Insert a coin first\n"; }
};
struct HasCoinState : State {
    void insertCoin(VendingMachine&) override { std::cout << "Coin already inserted\n"; }
    void selectItem(VendingMachine& vm) override;
};
struct SoldOutState : State {
    void insertCoin(VendingMachine&) override { std::cout << "Sold out, coin returned\n"; }
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

void IdleState::insertCoin(VendingMachine& vm) { std::cout << "Coin received\n"; vm.current = &vm.hasCoin; }
void HasCoinState::selectItem(VendingMachine& vm) {
    std::cout << "Dispensing item...\n";
    vm.current = (--vm.stock > 0) ? static_cast<State*>(&vm.idle) : &vm.soldOut;
}
int main() {
    VendingMachine vm(1);
    vm.selectItem();   // Insert a coin first
    vm.insertCoin();   // Coin received
    vm.selectItem();   // Dispensing item... (now SoldOut)
    vm.insertCoin();   // Sold out, coin returned
}
```

**Where in LLD problems:** Vending Machine (classic), ATM (Idle → CardInserted → PinVerified → Dispensing), Elevator (Idle / MovingUp / MovingDown / DoorOpen), Order status (Swiggy, Amazon), Traffic light, BookMyShow seat (Available → Held → Booked).

**Say this in the interview:** "For the vending machine I will use the State pattern. Each state handles its own actions and sets the next state, so an invalid transition (item without a coin) is not even possible in code."

**Common mistake:**
- Keeping business data (stock, balance) inside state classes. Keep data in the context (machine), and only behaviour in the state.
- Forgetting to implement every method in every state. Give a clear error/message for an invalid action.

## ⭐ Chain of Responsibility

**In one line:** send the request along a chain of handlers. Each handler either handles it or passes it on. The sender does not know who will handle it.

**Real example:** Leave approval in an office: up to 2 days the Team Lead, up to 5 days the Manager, more than that HR. Web server middleware is the same: auth → rate limit → logging → controller. Logger levels: DEBUG to console, INFO to file, ERROR to pager.

**When to use / when not:**
- Use it when a request has to pass through many checks/handlers and the order is configurable.
- Use it when handlers need to be added/removed at runtime (middleware).
- Don't use it when every request goes to one fixed handler. The chain will only add latency and debugging pain.

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
            else System.out.println("No handler: " + msg);
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
        chain.log(Level.INFO, "User logged in");   // InfoLogger will handle it
        chain.log(Level.ERROR, "Payment fail");     // reaches ErrorLogger
        chain.log(Level.DEBUG, "cache hit");        // the first one handles it
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
        else std::cout << "No handler: " << msg << "\n";
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
    chain->log(Level::Info, "User logged in");  // InfoLogger will handle it
    chain->log(Level::Error, "Payment fail");    // reaches ErrorLogger
    chain->log(Level::Debug, "cache hit");       // the first one handles it
}
```

**Where in LLD problems:** Logger (levels), ATM cash dispenser (2000 → 500 → 100 notes), Leave/expense approval, API middleware (auth, rate limiter, validation), Vending machine change return.

**Say this in the interview:** "For ATM cash dispensing I will use a chain: the 2000 handler gives as many notes as it can and passes the rest to the 500 handler, then 100. If a new denomination comes, I just add one link to the chain."

**Common mistake:**
- Having no default handler at the end of the chain. The request gets lost silently.
- Putting handlers in the wrong order (logging before auth, or rate limit after validation).

## ⭐ Command

**In one line:** turn an action (request) into an object. Then you can put it in a queue, log it, and most importantly, undo it.

**Real example:** Ctrl+Z in a text editor. Each typing action is a command object that goes onto a stack, and on undo it runs in reverse. A TV remote too: each button is a command, and the remote does not know what the TV does inside.

**When to use / when not:**
- Use it when you need undo/redo (editor, drawing app, game moves).
- Use it when actions need to be queued, scheduled or retried (job queue, macro, transaction log).
- Don't use it for simple CRUD with no undo and no queue. You will just end up with extra classes.

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

**Where in LLD problems:** Text editor (undo/redo), Chess (move history, undo move), Elevator (floor requests as commands in a queue), Smart home remote, Job scheduler / task queue.

**Say this in the interview:** "Each move is a `Command` object with both `execute` and `undo`. We keep them in a history stack, and on undo we pop and call `undo()`. Another stack for redo."

**Common mistake:**
- Not saving the old data needed for undo inside the command (like the deleted text).
- Not clearing the redo stack when a new command runs. Redo then does the wrong thing.

## Template Method

**In one line:** the base class fixes the order of an algorithm's steps, and subclasses fill in some steps their own way.

**Real example:** A payment flow is always validate → debit → receipt. UPI and Card differ only in how they "debit", and Card has an extra OTP step.

**When to use / when not:**
- Use it when many classes have the same flow and only a few middle steps differ.
- Use it when the order of steps must be enforced (no subclass can skip validate).
- Don't use it when there are too many variations. Then Strategy (composition) is better, inheritance gives tight coupling.

```java
public class TemplateDemo {
    static abstract class PaymentFlow {
        // template method: final, so a subclass cannot change the order
        public final void process(double amount) {
            validate(amount);
            debit(amount);
            if (needsOtp()) System.out.println("OTP verified");
            System.out.println("Receipt sent: Rs " + amount);
        }

        private void validate(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Invalid amount");
        }

        protected abstract void debit(double amount);    // different in each subclass
        protected boolean needsOtp() { return false; }   // hook, default false
    }

    static class UpiPayment extends PaymentFlow {
        protected void debit(double amount) { System.out.println("UPI collect request: Rs " + amount); }
    }

    static class CardPayment extends PaymentFlow {
        protected void debit(double amount) { System.out.println("Card charged: Rs " + amount); }
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
    // template method: non-virtual, so a subclass cannot change the order
    void process(double amount) {
        validate(amount);
        debit(amount);
        if (needsOtp()) std::cout << "OTP verified\n";
        std::cout << "Receipt sent: Rs " << amount << "\n";
    }
protected:
    virtual void debit(double amount) = 0;       // different in each subclass
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
    void debit(double amount) override { std::cout << "Card charged: Rs " << amount << "\n"; }
    bool needsOtp() const override { return true; }
};

int main() {
    UpiPayment upi;
    CardPayment card;
    upi.process(250);
    card.process(1200);
}
```

**Where in LLD problems:** Game flow (Chess, Snake & Ladder: `initBoard → while(!over) playTurn → declareWinner`), Payment processing, Report/CSV export, Notification (build → send → log).

**Say this in the interview:** "All games have the same skeleton, so `Game.play()` is a template method. Snake & Ladder and Chess only override `makeMove()` and `isOver()`."

**Common mistake:**
- Not making the template method `final` (Java) / non-virtual (C++). Then a subclass overrides the whole flow.
- A new subclass for every small variation. Class explosion. Use Strategy then.

## Iterator

**In one line:** hide the internal structure of a collection (array, tree, linked list) and give a common way to traverse it one element at a time.

**Real example:** Keep pressing "next" on a Spotify playlist. You don't know if the songs are in an array or a linked list. The infinite scroll of the Instagram feed is also a kind of iterator (cursor).

**When to use / when not:**
- Use it when you build a custom collection (board cells, tree, paginated API) and the client wants for-each.
- Use it when one collection has many traversals (forward, reverse, shuffle).
- Don't build your own when exposing a `List`/`vector` directly is fine. The language's built-in iterator is enough.

```java
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

public class IteratorDemo {
    static class Playlist implements Iterable<String> {
        private final List<String> songs = new ArrayList<>();   // internal structure is hidden
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
        for (String song : p) System.out.println("Playing: " + song);  // for-each uses iterator()
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
    std::vector<std::string> songs;   // internal structure is hidden
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
    for (const auto& song : p) std::cout << "Playing: " << song << "\n";  // uses begin()/end()
}
```

**Where in LLD problems:** Chess / Snake & Ladder (traverse board cells), File system (directory tree), Paginated results (cursor-based API), Social feed.

**Say this in the interview:** "I will make the board `Iterable` so the client writes `for (Cell c : board)` and does not know whether it is a 2D array or a map."

**Common mistake:**
- Modifying the collection while iterating (`ConcurrentModificationException` in Java, invalid iterator in C++).
- Returning the internal list itself (`getSongs()`). Encapsulation is gone, anyone outside can modify it.

## Mediator

**In one line:** when many objects talk to each other directly, it becomes a mess. Put a mediator in the middle, and everyone talks only to it.

**Real example:** A WhatsApp group. Mummy does not message each member separately, she posts in the group and the group delivers it to everyone. An airport ATC tower too: planes don't talk to each other, they talk to the tower.

**When to use / when not:**
- Use it when N objects are forming N×N connections (chat room, UI form fields, ATC).
- Use it when you want to centralize the interaction logic in one place.
- Don't use it when there are only 2–3 objects. The mediator itself can become a "God object".

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
        void receive(String msg, String from) { System.out.println(name + " got from " + from + ": " + msg); }
    }

    public static void main(String[] args) {
        ChatMediator family = new GroupChat();
        User mummy = new User("Mummy", family);
        User rahul = new User("Rahul", family);
        User priya = new User("Priya", family);
        family.join(mummy);
        family.join(rahul);
        family.join(priya);
        mummy.send("Food is ready");   // Rahul and Priya will get it
        rahul.send("Coming in 5 min");     // Mummy and Priya will get it
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
    std::vector<User*> users;   // non-owning, main() owns the users
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
        std::cout << name << " got from " << from << ": " << msg << "\n";
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
    mummy.send("Food is ready");   // Rahul and Priya will get it
    rahul.send("Coming in 5 min");     // Mummy and Priya will get it
}
```

**Where in LLD problems:** Elevator (ElevatorController decides which lift goes, lifts don't talk to each other), Chat room, Splitwise (ExpenseManager manages balances between users), Auction house, Chess game controller.

**Say this in the interview:** "Lifts don't know about each other. `ElevatorController` is the mediator that takes all requests and assigns the best lift."

**Common mistake:**
- Stuffing all business logic into the mediator. It becomes a God class. Limit it to coordination.
- Confusing Mediator and Observer. Observer is a one-to-many broadcast, Mediator is many-to-many coordination.

## Memento

**In one line:** save a snapshot of an object's state and bring the same state back later, without exposing its private fields.

**Real example:** Saving a checkpoint in a game. If you die, you start from the last checkpoint. Google Docs version history is the same: restore an old version.

**When to use / when not:**
- Use it when you need the full state back for undo/rollback (editor, game save, form draft).
- Use it when you want to save state outside but not break encapsulation.
- Don't use it when the state is very big and you need snapshots often. Memory will blow up, then Command (only the diff) is better.

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class MementoDemo {
    // Memento: immutable snapshot
    record EditorSnapshot(String text, int cursor) {}

    // Originator: creates and restores a snapshot of its own state
    static class Editor {
        private String text = "";
        private int cursor = 0;
        void type(String s) { text += s; cursor = text.length(); }
        EditorSnapshot save() { return new EditorSnapshot(text, cursor); }
        void restore(EditorSnapshot s) { text = s.text(); cursor = s.cursor(); }
        @Override public String toString() { return text + " (cursor " + cursor + ")"; }
    }

    // Caretaker: keeps the snapshots, does not look inside
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

// Originator: creates and restores a snapshot of its own state
class Editor {
    std::string text;
    std::size_t cursor = 0;
public:
    class Snapshot {               // Memento: only Editor can see inside
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

**Where in LLD problems:** Text editor (undo), Chess / Snake & Ladder (game save, undo move), Vending machine / ATM (rollback when a transaction fails), Form draft save.

**Say this in the interview:** "There are two options for undo: Command, which only reverses the change, or Memento, which keeps a full snapshot. If the state is small, Memento is simple. If it is big, use Command."

**Common mistake:**
- Keeping the memento mutable or making its fields public. Anyone can change the snapshot.
- Keeping unlimited snapshots. Put a limit on history (last 50).

## Visitor

**In one line:** add new operations to objects without touching their classes. Each operation is a visitor class that has a separate `visit` method for each type.

**Real example:** A Flipkart cart has a Book and a Mobile. Calculating GST, working out shipping, making an invoice: these are all separate operations. Instead of adding a new method to the Item class every time, make one visitor per operation.

**When to use / when not:**
- Use it when classes (types) are stable but new operations keep coming (tax, export, report).
- Use it when you need to run many different operations on an object tree (Composite) (file size, search, compiler AST).
- Don't use it when new types are added often. For every new type, you will have to change all visitors.

```java
import java.util.List;

public class VisitorDemo {
    interface ItemVisitor {
        double visit(Book b);
        double visit(Mobile m);
    }

    interface Item {
        double accept(ItemVisitor v);   // double dispatch happens here
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
    virtual double accept(ItemVisitor& v) const = 0;   // double dispatch happens here
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

**Where in LLD problems:** Shopping cart (tax, discount, shipping), File system (size calculation, search, together with Composite), Parking Lot (fee report by vehicle type), Compiler / expression evaluator.

**Say this in the interview:** "Item types are fixed but operations will keep growing, so I will use Visitor. A new operation, like invoice, is just a new visitor class, and `Book`/`Mobile` won't be touched."

**Common mistake:**
- Using Visitor in a domain where types change often. Every new type means editing every visitor.
- Writing `instanceof` / `dynamic_cast` inside the visitor. The whole point of double dispatch is that you don't need type checks.

## ⭐ How to choose a pattern

In the interview, first spot the problem/smell, then name the pattern. Picking the pattern first and fitting the problem later is backwards.

### Problem / smell → pattern

| Problem or code smell | Pattern | Type |
|---|---|---|
| You need only one instance in the whole app (config, logger, DB pool) | Singleton | Creational |
| A chain of `if-else` with `new`: creating an object based on type | Factory | Creational |
| Constructor with 6+ params, many optional | Builder | Creational |
| A whole family of related objects must change together (Light/Dark UI, AWS/GCP) | Abstract Factory | Creational |
| Creating an object is expensive, copying an existing one is enough | Prototype | Creational |
| A third-party/legacy API's interface does not match our interface | Adapter | Structural |
| Add features at runtime (toppings, logging, compression) without subclass explosion | Decorator | Structural |
| You need one simple entry point for a complex subsystem | Facade | Structural |
| You need access control, lazy loading, caching or a remote call in between | Proxy | Structural |
| A tree structure where leaf and group are treated the same (folder/file) | Composite | Structural |
| Two dimensions grow independently (Shape × Color, Remote × Device) | Bridge | Structural |
| Lakhs of small similar objects, need to save memory (chess pieces, map trees) | Flyweight | Structural |
| Many algorithms for one task, swapped at runtime (`if type == ...` chain) | Strategy | Behavioral |
| Many parts react to one event (notifications, UI refresh) | Observer | Behavioral |
| Behaviour depends on the current status, `switch(state)` everywhere | State | Behavioral |
| A request passes through many handlers/checks, order configurable (middleware, approval) | Chain of Responsibility | Behavioral |
| Undo/redo, or actions need to be queued/logged/retried | Command | Behavioral |
| Same flow, only a few steps differ (game loop, payment flow) | Template Method | Behavioral |
| Traverse a custom collection without showing its internals | Iterator | Behavioral |
| Too many objects are tangled with each other (N×N calls) | Mediator | Behavioral |
| Save/restore a snapshot of state without breaking encapsulation | Memento | Behavioral |
| Types are fixed, but new operations on them are added often | Visitor | Behavioral |

### LLD question → patterns

| LLD question | Patterns | Where it is used |
|---|---|---|
| Parking Lot | Singleton, Factory, Strategy, Observer | ParkingLot as one instance, vehicle/spot Factory, fee Strategy (hourly/flat), display board Observer |
| Elevator | State, Strategy, Mediator, Command | Lift State (Idle/Up/Down), scheduling Strategy, Controller Mediator, requests as Command |
| Vending Machine | State, Chain of Responsibility, Singleton | Idle/HasCoin/Dispensing/SoldOut State, change return Chain |
| Splitwise | Strategy, Factory, Observer, Mediator | Equal/Exact/Percent split Strategy, ExpenseFactory, balance update Observer |
| BookMyShow | Singleton, Factory, Strategy, Observer, State | Payment Strategy, seat State (Available/Held/Booked), waitlist Observer when a seat becomes free |
| Logger | Singleton, Chain of Responsibility, Strategy, Observer | Level-wise Chain, output Strategy (console/file), multiple sinks Observer |
| Chess | Factory, Command, Memento, Strategy, Flyweight | Piece Factory, move Command (undo), game save Memento, piece movement Strategy |
| Snake & Ladder | Factory, Template Method, Strategy, Iterator | Board Factory, game loop Template, dice Strategy (normal/crooked), players turn Iterator |
| Notification service | Observer, Strategy, Factory, Decorator, Template Method | Event → Observer, channel Strategy (SMS/email/push), retry/logging Decorator |
| Rate limiter | Strategy, Factory, Singleton, Proxy, Chain of Responsibility | Token bucket / sliding window Strategy, limiter Proxy or middleware Chain |
| Cache LRU | Strategy, Proxy, Decorator, Singleton | Eviction Strategy (LRU/LFU), caching Proxy in front of the service |
| ATM | State, Chain of Responsibility, Facade, Singleton | Card/PIN/Dispense State, note dispenser Chain (2000→500→100), bank ops Facade |

## Checklist

- [ ] I can tell the difference between Strategy and State in one line (who switches: the client or the object itself).
- [ ] I can write Observer code without looking, and explain the unsubscribe/async issue.
- [ ] I can draw the State diagram and classes for a Vending Machine or ATM in 5 min.
- [ ] I can explain an ATM note dispenser or middleware using Chain of Responsibility.
- [ ] I can implement undo/redo with Command and compare Command vs Memento.
- [ ] I can give one real use case each for Template Method, Iterator, Mediator and Visitor.
- [ ] I can look at any code smell and name the right pattern (the How to choose a pattern table).
- [ ] I can quickly tell which patterns fit Parking Lot, Elevator, Splitwise and BookMyShow.
