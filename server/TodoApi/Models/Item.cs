using System;
using System.Collections.Generic;

namespace TodoApi.Models;

public partial class Item
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public bool? IsComplete { get; set; }

    // השדה החדש שמקשר בין המשימה למשתמש
    public int UserId { get; set; }
}
