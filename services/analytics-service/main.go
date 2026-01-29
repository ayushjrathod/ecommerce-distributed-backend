package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/IBM/sarama"
	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Event structures
type UserEvent struct {
	Type   string `json:"type"`
	UserID string `json:"userId"`
	Email  string `json:"email"`
	Time   string `json:"timestamp"`
}

type OrderEvent struct {
	Type    string  `json:"type"`
	OrderID string  `json:"orderId"`
	UserID  string  `json:"userId"`
	Total   float64 `json:"total"`
	Time    string  `json:"timestamp"`
}

// Simple in-memory analytics store (you can replace with a database later)
type AnalyticsData struct {
	TotalUsers      int64     `json:"totalUsers"`
	TotalOrders     int64     `json:"totalOrders"`
	TotalRevenue    float64   `json:"totalRevenue"`
	LastUpdated     time.Time `json:"lastUpdated"`
	EventsProcessed int64     `json:"eventsProcessed"`
}

var analytics = &AnalyticsData{
	LastUpdated: time.Now(),
}

// Prometheus metrics
var (
	eventsProcessed = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "analytics_events_processed_total",
			Help: "Total number of events processed",
		},
		[]string{"event_type"},
	)

	totalRevenue = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "analytics_total_revenue",
			Help: "Total revenue tracked",
		},
	)
)

func init() {
	prometheus.MustRegister(eventsProcessed)
	prometheus.MustRegister(totalRevenue)
}

// Kafka consumer
func consumeEvents() {
	config := sarama.NewConfig()
	config.Consumer.Return.Errors = true

	brokers := []string{"localhost:9092"} // Update with your Kafka brokers

	consumer, err := sarama.NewConsumer(brokers, config)
	if err != nil {
		log.Fatalf("Failed to create consumer: %v", err)
	}
	defer consumer.Close()

	topics := []string{"user-events", "order-events"}

	for _, topic := range topics {
		go consumeTopic(consumer, topic)
	}

	// Wait for interrupt signal
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, syscall.SIGINT, syscall.SIGTERM)
	<-sigterm
}

func consumeTopic(consumer sarama.Consumer, topic string) {
	partitionConsumer, err := consumer.ConsumePartition(topic, 0, sarama.OffsetNewest)
	if err != nil {
		log.Printf("Failed to consume topic %s: %v", topic, err)
		return
	}
	defer partitionConsumer.Close()

	log.Printf("Started consuming topic: %s", topic)

	for {
		select {
		case message := <-partitionConsumer.Messages():
			processEvent(topic, message.Value)
		case err := <-partitionConsumer.Errors():
			log.Printf("Error consuming from topic %s: %v", topic, err)
		}
	}
}

func processEvent(topic string, data []byte) {
	analytics.EventsProcessed++
	analytics.LastUpdated = time.Now()

	switch topic {
	case "user-events":
		var event UserEvent
		if err := json.Unmarshal(data, &event); err == nil {
			if event.Type == "user-registered" {
				analytics.TotalUsers++
				log.Printf("New user registered: %s", event.UserID)
			}
			eventsProcessed.WithLabelValues("user").Inc()
		}

	case "order-events":
		var event OrderEvent
		if err := json.Unmarshal(data, &event); err == nil {
			if event.Type == "order-placed" {
				analytics.TotalOrders++
				analytics.TotalRevenue += event.Total
				totalRevenue.Set(analytics.TotalRevenue)
				log.Printf("New order: %s, Total: $%.2f", event.OrderID, event.Total)
			}
			eventsProcessed.WithLabelValues("order").Inc()
		}
	}
}

// HTTP handlers
func getAnalytics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(analytics)
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "healthy",
		"service": "analytics-service",
		"time":    time.Now().Format(time.RFC3339),
	})
}

func main() {
	// Start Kafka consumer in background
	go consumeEvents()

	// Setup HTTP router
	router := mux.NewRouter()

	// API routes
	router.HandleFunc("/", healthCheck).Methods("GET")
	router.HandleFunc("/analytics", getAnalytics).Methods("GET")

	// Metrics endpoint
	router.Handle("/metrics", promhttp.Handler())

	// Start HTTP server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Analytics Service starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
