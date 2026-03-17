// Java demo
import java.util.List;
import java.util.ArrayList;

public class Demo {
    private String name;

    public Demo(String name) {
        this.name = name;
    }

    public String greet() {
        return "Hello, " + name + "!";
    }

    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("Alice");
        names.add("Bob");
        for (String n : names) {
            System.out.println(new Demo(n).greet());
        }
    }
}
