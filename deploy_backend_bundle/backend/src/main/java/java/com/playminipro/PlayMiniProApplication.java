package com.playminipro;

import com.playminipro.common.config.JwtProperties;
import com.playminipro.common.config.WechatProperties;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@MapperScan("com.playminipro")
@EnableConfigurationProperties({JwtProperties.class, WechatProperties.class})
public class PlayMiniProApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlayMiniProApplication.class, args);
    }
}