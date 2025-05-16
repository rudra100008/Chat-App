package com.ChatApplication.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PageInfo<T> {
    private List<T> data;
    private Integer pageNumber;
    private Integer pageSize;
    private Integer totalPage;
    private Long totalElement;
    private Boolean lastPage;
}
