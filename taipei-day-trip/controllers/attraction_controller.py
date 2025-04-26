from fastapi.responses import JSONResponse
from models.attraction_model import fetch_attractions
from models.attraction_model import fetch_attraction_by_id
from models.attraction_model import fetch_mrts

def get_attractions_controller(page: int, keyword: str):
    try:
        data = fetch_attractions(page, keyword)
        return JSONResponse(content={"nextPage": data["next_page"], "data": data["results"]})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
    
def get_attraction_by_id_controller(attraction_id: int):
    try:
        data = fetch_attraction_by_id(attraction_id)
        if not data:
            return JSONResponse(status_code=400, content={"error": True, "message": "景點編號不正確"})
        return {"data": data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})
    
def get_mrts_controller():
    try:
        data = fetch_mrts()
        return {"data": data}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": True, "message": str(e)})