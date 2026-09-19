package com.eaglemotion.backend.video;

import com.eaglemotion.backend.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VideoRepository extends JpaRepository<Video, Long> {

    List<Video> findByUserOrderByCreatedAtDesc(User user);

    Optional<Video> findByIdAndUser(Long id, User user);
}