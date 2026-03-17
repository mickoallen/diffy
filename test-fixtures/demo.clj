;; Clojure demo
(defrecord Animal [name sound])

(defn speak [animal]
  (str (:name animal) " says " (:sound animal)))

(defn greet [name]
  (str "Hello, " name "!"))

(def animals [(->Animal "Cat" "meow") (->Animal "Dog" "woof")])

(doseq [a animals]
  (println (speak a)))

(println (greet "World"))
