package com.vn.son.jobhunter.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
@ConditionalOnProperty(prefix = "jobhunter.scheduler", name = "enabled", havingValue = "true")
public class SchedulingConfiguration {
}
