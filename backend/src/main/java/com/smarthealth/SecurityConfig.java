package com.smarthealth;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
class SecurityConfig {

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  UserDetailsService userDetailsService(Users users) {
    return email -> {
      var user = users
        .findByEmail(email.toLowerCase())
        .orElseThrow(() ->
          new UsernameNotFoundException("Invalid credentials")
        );
      return User.withUsername(user.email)
        .password(user.password)
        .roles(user.role)
        .disabled(!user.enabled)
        .build();
    };
  }

  @Bean
  SecurityFilterChain security(HttpSecurity http, Users users)
    throws Exception {
    http
      .csrf(c ->
        c.csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
      )
      .authorizeHttpRequests(a ->
        a
          .requestMatchers(
            "/api/auth/csrf",
            "/api/auth/register",
            "/api/auth/login",
            "/api/health"
          )
          .permitAll()
          .requestMatchers("/api/admin/**")
          .hasRole("ADMIN")
          .requestMatchers("/api/process/**")
          .hasAnyRole("ADMIN", "DOCTOR")
          .requestMatchers("/api/**")
          .authenticated()
          .anyRequest()
          .permitAll()
      )
      .formLogin(f ->
        f
          .loginProcessingUrl("/api/auth/login")
          .successHandler((q, s, a) -> {
            s.setContentType("application/json");
            s.getWriter().write("{\"ok\":true}");
          })
          .failureHandler((q, s, e) -> {
            s.setStatus(401);
            s.setContentType("application/json");
            s.getWriter().write("{\"message\":\"Invalid email or password\"}");
          })
      )
      .logout(l ->
        l
          .logoutUrl("/api/auth/logout")
          .logoutSuccessHandler((q, s, a) -> s.setStatus(204))
      )
      .exceptionHandling(e ->
        e
          .authenticationEntryPoint((q, s, x) -> s.sendError(401))
          .accessDeniedHandler((q, s, x) -> s.sendError(403))
      );
    // Revoking a doctor account also revokes already authenticated sessions on their next request.
    http.addFilterAfter(
      new OncePerRequestFilter() {
        @Override
        protected void doFilterInternal(
          HttpServletRequest request,
          HttpServletResponse response,
          FilterChain chain
        ) throws ServletException, IOException {
          var auth = SecurityContextHolder.getContext().getAuthentication();
          if (
            auth != null &&
            auth.isAuthenticated() &&
            !auth.getName().equals("anonymousUser")
          ) {
            var account = users.findByEmail(auth.getName());
            if (account.isEmpty() || !account.get().enabled) {
              if (request.getSession(false) != null) request
                .getSession(false)
                .invalidate();
              SecurityContextHolder.clearContext();
              response.sendError(401);
              return;
            }
          }
          chain.doFilter(request, response);
        }
      },
      AuthorizationFilter.class
    );
    return http.build();
  }
}
