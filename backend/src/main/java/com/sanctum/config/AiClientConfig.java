package com.sanctum.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class AiClientConfig {

    @Bean
    public RestClient aiRestClient(SanctumProperties properties) {
        SanctumProperties.Ai ai = properties.ai();
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(Math.min(10, ai.timeoutSeconds())))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(ai.timeoutSeconds()));
        return RestClient.builder()
                .baseUrl(ai.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }
}
