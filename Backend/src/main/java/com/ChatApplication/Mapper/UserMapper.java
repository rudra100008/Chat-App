package com.ChatApplication.Mapper;

import com.ChatApplication.DTO.UserDTO;
import com.ChatApplication.Entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    User toUser(UserDTO userDTO);

    @Mapping(target = "password",ignore = true)
    UserDTO toUserDTO(User user);

    List<UserDTO> toUserDTOs(List<User> users);
}
