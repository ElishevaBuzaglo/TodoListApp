using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using TodoApi.Models;
using TodoApi.Services;

namespace TodoApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ItemsController : ControllerBase
    {
        private readonly ItemService _itemService;
        public ItemsController(ItemService itemService) => _itemService = itemService;

        private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Item>>> Get() => Ok(await _itemService.GetAllAsync(GetUserId()));

        [HttpPost]
        public async Task<ActionResult<Item>> Post([FromBody] Item newItem)
        {
            var createdItem = await _itemService.CreateAsync(newItem, GetUserId());
            return CreatedAtAction(nameof(Get), new { id = createdItem.Id }, createdItem);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Item inputItem)
        {
            if (await _itemService.UpdateAsync(id, inputItem, GetUserId())) return NoContent();
            return NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (await _itemService.DeleteAsync(id, GetUserId())) return Ok();
            return NotFound();
        }
    }
}