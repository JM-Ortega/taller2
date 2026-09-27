package co.edu.unicauca.saberpro.pregunta;

import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.outbox.OutboxEventJpaRepository;
import co.edu.unicauca.saberpro.pregunta.infrastructure.persistence.jpa.pregunta.PreguntaJpaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import static org.mockito.Mockito.mock;

@SpringBootTest(properties = {
    "spring.grpc.server.port=0",
    "spring.rabbitmq.dynamic=false",
    "spring.rabbitmq.listener.simple.auto-startup=false",
    "pregunta.outbox.scheduler.enabled=false"
})
@EnableAutoConfiguration(exclude = {
    DataSourceAutoConfiguration.class,
    HibernateJpaAutoConfiguration.class,
    DataJpaRepositoriesAutoConfiguration.class
})
class PreguntaServiceApplicationTests {

    @Test
    void contextLoads() {
    }

    @TestConfiguration
    static class InfraestructuraExcluidaTestConfig {

        @Bean
        PreguntaJpaRepository preguntaJpaRepository() {
            return mock(PreguntaJpaRepository.class);
        }

        @Bean
        EntityManager entityManager() {
            return mock(EntityManager.class);
        }

        @Bean
        OutboxEventJpaRepository outboxEventJpaRepository() {
            return mock(OutboxEventJpaRepository.class);
        }
    }
}
