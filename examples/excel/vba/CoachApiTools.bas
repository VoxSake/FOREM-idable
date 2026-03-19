Attribute VB_Name = "CoachApiTools"
Option Explicit

Public Sub RefreshCoachWorkbook()
    Application.ScreenUpdating = False
    ThisWorkbook.RefreshAll
    Application.ScreenUpdating = True
    MsgBox "Rafraichissement lance.", vbInformation, "Coach API"
End Sub

Public Sub GoToDashboard()
    Worksheets("Dashboard").Activate
End Sub

Public Sub GoToApplications()
    Worksheets("Applications").Activate
End Sub

Public Sub GoToBeneficiaires()
    Worksheets("Beneficiaires").Activate
End Sub

Public Sub GoToGroups()
    Worksheets("Groups").Activate
End Sub
