package co.edu.unicauca.saberpro.pregunta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PreguntaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PreguntaServiceApplication.class, args);
    }
}
