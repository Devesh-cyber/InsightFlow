from pydantic import BaseModel, Field

class UploadResponse(BaseModel):
    ''' Response returned after successfull dataset upload'''

    status : str = Field(..., min_length=1, description='Status of the upload request', examples=['success'])
    message : str = Field(..., min_length=1, description='Response Message', examples=['Dataset uploaded successfully'])
    dataset_id : str = Field(..., min_length=1, description='Unique dataset session identifier')
    filename : str = Field(..., min_length=1, description='Original uploaded filename', examples=['titanic.csv'])
    rows : int = Field(..., ge=0,  description='Total rows in the uploaded dataset')
    columns : int = Field(..., ge=0, description='Total columns in the uploaded dataset')