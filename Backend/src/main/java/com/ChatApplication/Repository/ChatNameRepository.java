package com.ChatApplication.Repository;

import com.ChatApplication.Entity.ChatName;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatNameRepository extends JpaRepository<ChatName,Integer> {
}
